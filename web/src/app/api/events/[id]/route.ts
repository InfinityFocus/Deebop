import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { buildEventContext, canViewEvent, canRsvp, canUploadToGallery, canManageEvent } from '@/lib/event-permissions';
import type { UpdateEventPayload, EventDetail } from '@/types/event';

// GET /api/events/[id] - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        rsvps: user ? {
          where: { userId: user.id },
          take: 1,
        } : false,
        invites: user ? {
          where: { inviteeId: user.id },
          take: 1,
        } : false,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is invited (direct invite or link redemption)
    let isInvited = false;
    if (user) {
      if (Array.isArray(event.invites) && event.invites.length > 0) {
        isInvited = true;
      } else {
        // Check for link redemption
        const redemption = await prisma.eventInviteLinkRedemption.findFirst({
          where: {
            userId: user.id,
            inviteLink: { eventId: id },
          },
        });
        isInvited = !!redemption;
      }
    }

    // Check if user follows the host
    let isFollower = false;
    if (user && event.hostId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: event.hostId,
          },
        },
      });
      isFollower = !!follow;
    }

    // Get user's RSVP status
    const myRsvpStatus = Array.isArray(event.rsvps) && event.rsvps.length > 0
      ? event.rsvps[0].status
      : null;

    // Build permission context
    const ctx = buildEventContext({
      event: {
        status: event.status,
        visibility: event.visibility,
        hostId: event.hostId,
        rsvpLocked: event.rsvpLocked,
        rsvpDeadlineAt: event.rsvpDeadlineAt,
        startAt: event.startAt,
        endAt: event.endAt,
        showAttendeeList: event.showAttendeeList,
        allowMaybeUploads: event.allowMaybeUploads,
        uploadWindow: event.uploadWindow,
      },
      userId: user?.id ?? null,
      rsvpStatus: myRsvpStatus,
      isInvited,
      isFollower,
    });

    // Check view permission
    if (!canViewEvent(ctx)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const eventDetail: EventDetail = {
      id: event.id,
      title: event.title,
      description: event.description,
      coverImageUrl: event.coverImageUrl,
      startAt: event.startAt,
      endAt: event.endAt,
      rsvpDeadlineAt: event.rsvpDeadlineAt,
      locationName: event.locationName,
      locationMode: event.locationMode,
      visibility: event.visibility,
      rsvpLocked: event.rsvpLocked,
      showAttendeeList: event.showAttendeeList,
      allowMaybeUploads: event.allowMaybeUploads,
      uploadWindow: event.uploadWindow,
      status: event.status,
      attendingCount: event.attendingCount,
      maybeCount: event.maybeCount,
      invitedCount: event.invitedCount,
      albumId: event.albumId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      host: {
        id: event.host.id,
        username: event.host.username,
        displayName: event.host.displayName,
        avatarUrl: event.host.avatarUrl,
      },
      myRsvpStatus,
      isHost: ctx.isHost,
      isInvited,
      canRsvp: canRsvp(ctx),
      canUpload: canUploadToGallery(ctx),
      canManage: canManageEvent(ctx),
    };

    return NextResponse.json({ event: eventDetail });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

// PATCH /api/events/[id] - Update event (host only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only host can update
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can update this event' }, { status: 403 });
    }

    // Cannot update cancelled events
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot update a cancelled event' }, { status: 400 });
    }

    const body: UpdateEventPayload = await request.json();
    const updateData: any = {};

    // Handle each updateable field
    if (body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.coverImageUrl !== undefined) {
      updateData.coverImageUrl = body.coverImageUrl || null;
    }

    if (body.startAt !== undefined) {
      const parsedStartAt = new Date(body.startAt);
      if (isNaN(parsedStartAt.getTime())) {
        return NextResponse.json({ error: 'Invalid start time format' }, { status: 400 });
      }
      updateData.startAt = parsedStartAt;
    }

    if (body.endAt !== undefined) {
      const parsedEndAt = new Date(body.endAt);
      if (isNaN(parsedEndAt.getTime())) {
        return NextResponse.json({ error: 'Invalid end time format' }, { status: 400 });
      }
      updateData.endAt = parsedEndAt;
    }

    // Validate start/end time relationship
    const effectiveStartAt = updateData.startAt || event.startAt;
    const effectiveEndAt = updateData.endAt || event.endAt;
    if (effectiveEndAt <= effectiveStartAt) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    if (body.rsvpDeadlineAt !== undefined) {
      if (body.rsvpDeadlineAt === null) {
        updateData.rsvpDeadlineAt = null;
      } else {
        const parsedDeadline = new Date(body.rsvpDeadlineAt);
        if (isNaN(parsedDeadline.getTime())) {
          return NextResponse.json({ error: 'Invalid RSVP deadline format' }, { status: 400 });
        }
        if (parsedDeadline > effectiveStartAt) {
          return NextResponse.json({ error: 'RSVP deadline must be before event starts' }, { status: 400 });
        }
        updateData.rsvpDeadlineAt = parsedDeadline;
      }
    }

    if (body.locationName !== undefined) {
      updateData.locationName = body.locationName?.trim() || null;
    }

    if (body.locationMode !== undefined) {
      updateData.locationMode = body.locationMode;
    }

    if (body.visibility !== undefined) {
      updateData.visibility = body.visibility;
    }

    if (body.rsvpLocked !== undefined) {
      updateData.rsvpLocked = body.rsvpLocked;
    }

    if (body.showAttendeeList !== undefined) {
      updateData.showAttendeeList = body.showAttendeeList;
    }

    if (body.allowMaybeUploads !== undefined) {
      updateData.allowMaybeUploads = body.allowMaybeUploads;
    }

    if (body.uploadWindow !== undefined) {
      updateData.uploadWindow = body.uploadWindow;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        coverImageUrl: updatedEvent.coverImageUrl,
        startAt: updatedEvent.startAt,
        endAt: updatedEvent.endAt,
        rsvpDeadlineAt: updatedEvent.rsvpDeadlineAt,
        locationName: updatedEvent.locationName,
        locationMode: updatedEvent.locationMode,
        visibility: updatedEvent.visibility,
        rsvpLocked: updatedEvent.rsvpLocked,
        showAttendeeList: updatedEvent.showAttendeeList,
        allowMaybeUploads: updatedEvent.allowMaybeUploads,
        uploadWindow: updatedEvent.uploadWindow,
        status: updatedEvent.status,
        attendingCount: updatedEvent.attendingCount,
        maybeCount: updatedEvent.maybeCount,
        invitedCount: updatedEvent.invitedCount,
        albumId: updatedEvent.albumId,
        createdAt: updatedEvent.createdAt,
        updatedAt: updatedEvent.updatedAt,
        host: updatedEvent.host,
      },
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
