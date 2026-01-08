import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { buildEventContext, canViewAttendees } from '@/lib/event-permissions';
import type { EventAttendees, EventRsvpWithUser } from '@/types/event';

// GET /api/events/[id]/attendees - List attendees by RSVP status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is invited
    let isInvited = false;
    if (user) {
      const invite = await prisma.eventInvite.findFirst({
        where: { eventId: id, inviteeId: user.id },
      });
      if (invite) {
        isInvited = true;
      } else {
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
    let myRsvpStatus = null;
    if (user) {
      const rsvp = await prisma.eventRsvp.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId: user.id,
          },
        },
      });
      myRsvpStatus = rsvp?.status ?? null;
    }

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

    // Check permission to view attendees
    if (!canViewAttendees(ctx)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch attendees grouped by status
    const rsvps = await prisma.eventRsvp.findMany({
      where: {
        eventId: id,
        status: { in: ['attending', 'maybe', 'cant_make_it'] },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { respondedAt: 'asc' },
    });

    const attending: EventRsvpWithUser[] = [];
    const maybe: EventRsvpWithUser[] = [];
    const cantMakeIt: EventRsvpWithUser[] = [];

    for (const rsvp of rsvps) {
      const formatted: EventRsvpWithUser = {
        id: rsvp.id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        respondedAt: rsvp.respondedAt,
        createdAt: rsvp.createdAt,
        updatedAt: rsvp.updatedAt,
        user: {
          id: rsvp.user.id,
          username: rsvp.user.username,
          displayName: rsvp.user.displayName,
          avatarUrl: rsvp.user.avatarUrl,
        },
      };

      switch (rsvp.status) {
        case 'attending':
          attending.push(formatted);
          break;
        case 'maybe':
          maybe.push(formatted);
          break;
        case 'cant_make_it':
          cantMakeIt.push(formatted);
          break;
      }
    }

    const response: EventAttendees = {
      attending,
      maybe,
      cantMakeIt,
      total: attending.length + maybe.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get attendees error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
}
