import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { buildEventContext, canRsvp } from '@/lib/event-permissions';
import type { RsvpPayload } from '@/types/event';

// POST /api/events/[id]/rsvp - Set RSVP status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RsvpPayload = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['attending', 'maybe', 'cant_make_it'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status. Must be attending, maybe, or cant_make_it' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        rsvps: {
          where: { userId: user.id },
          take: 1,
        },
        invites: {
          where: { inviteeId: user.id },
          take: 1,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is invited
    let isInvited = event.invites.length > 0;
    if (!isInvited) {
      // Check for link redemption
      const redemption = await prisma.eventInviteLinkRedemption.findFirst({
        where: {
          userId: user.id,
          inviteLink: { eventId: id },
        },
      });
      isInvited = !!redemption;
    }

    // Check if user follows the host
    let isFollower = false;
    if (event.hostId !== user.id) {
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

    // Get existing RSVP status
    const existingRsvp = event.rsvps.length > 0 ? event.rsvps[0] : null;

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
      userId: user.id,
      rsvpStatus: existingRsvp?.status ?? null,
      isInvited,
      isFollower,
    });

    // Check RSVP permission
    if (!canRsvp(ctx)) {
      if (ctx.isHost) {
        return NextResponse.json({ error: 'Host cannot RSVP to their own event' }, { status: 400 });
      }
      if (event.status !== 'scheduled') {
        return NextResponse.json({ error: 'Event is not accepting RSVPs' }, { status: 400 });
      }
      if (event.rsvpLocked) {
        return NextResponse.json({ error: 'RSVPs are locked for this event' }, { status: 400 });
      }
      if (event.rsvpDeadlineAt && new Date() > event.rsvpDeadlineAt) {
        return NextResponse.json({ error: 'RSVP deadline has passed' }, { status: 400 });
      }
      return NextResponse.json({ error: 'You are not invited to this event' }, { status: 403 });
    }

    // Get previous status for count updates
    const previousStatus = existingRsvp?.status;

    // Upsert RSVP
    const rsvp = await prisma.$transaction(async (tx) => {
      // Update RSVP
      const updatedRsvp = await tx.eventRsvp.upsert({
        where: {
          eventId_userId: {
            eventId: id,
            userId: user.id,
          },
        },
        create: {
          eventId: id,
          userId: user.id,
          status,
          respondedAt: new Date(),
        },
        update: {
          status,
          respondedAt: new Date(),
        },
      });

      // Update event counts
      const countUpdates: any = {};

      // Decrement old status count
      if (previousStatus === 'attending') {
        countUpdates.attendingCount = { decrement: 1 };
      } else if (previousStatus === 'maybe') {
        countUpdates.maybeCount = { decrement: 1 };
      }

      // Increment new status count
      if (status === 'attending') {
        countUpdates.attendingCount = {
          ...(countUpdates.attendingCount || {}),
          increment: 1,
        };
        // Handle decrement + increment for same field
        if (previousStatus === 'attending') {
          delete countUpdates.attendingCount;
        }
      } else if (status === 'maybe') {
        countUpdates.maybeCount = {
          ...(countUpdates.maybeCount || {}),
          increment: 1,
        };
        if (previousStatus === 'maybe') {
          delete countUpdates.maybeCount;
        }
      }

      // Apply count updates if any
      if (Object.keys(countUpdates).length > 0) {
        await tx.event.update({
          where: { id },
          data: countUpdates,
        });
      }

      return updatedRsvp;
    });

    return NextResponse.json({
      rsvp: {
        id: rsvp.id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        respondedAt: rsvp.respondedAt,
      },
      message: `RSVP updated to ${status}`,
    });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/rsvp - Remove RSVP (set to no_response)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingRsvp = await prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: user.id,
        },
      },
    });

    if (!existingRsvp) {
      return NextResponse.json({ error: 'No RSVP found' }, { status: 404 });
    }

    const previousStatus = existingRsvp.status;

    await prisma.$transaction(async (tx) => {
      // Update RSVP to no_response
      await tx.eventRsvp.update({
        where: {
          eventId_userId: {
            eventId: id,
            userId: user.id,
          },
        },
        data: {
          status: 'no_response',
          respondedAt: null,
        },
      });

      // Decrement count for previous status
      if (previousStatus === 'attending') {
        await tx.event.update({
          where: { id },
          data: { attendingCount: { decrement: 1 } },
        });
      } else if (previousStatus === 'maybe') {
        await tx.event.update({
          where: { id },
          data: { maybeCount: { decrement: 1 } },
        });
      }
    });

    return NextResponse.json({
      message: 'RSVP removed',
    });
  } catch (error) {
    console.error('Remove RSVP error:', error);
    return NextResponse.json({ error: 'Failed to remove RSVP' }, { status: 500 });
  }
}
