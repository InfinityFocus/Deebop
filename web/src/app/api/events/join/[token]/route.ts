import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import type { RedeemInviteLinkResponse, InviteLinkInfoResponse } from '@/types/event';

// GET /api/events/join/[token] - Get event info from invite link (no auth required for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getCurrentUser(); // Optional - may be null

    const inviteLink = await prisma.eventInviteLink.findUnique({
      where: { token },
      include: {
        event: {
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
        },
      },
    });

    if (!inviteLink) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    // Check if link is usable
    const now = new Date();
    const isExpired = inviteLink.expiresAt ? inviteLink.expiresAt < now : false;
    const remainingUses = inviteLink.maxUses - inviteLink.usedCount;

    if (inviteLink.isRevoked) {
      return NextResponse.json({ error: 'This invite link has been revoked' }, { status: 400 });
    }

    if (isExpired) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 });
    }

    if (remainingUses <= 0) {
      return NextResponse.json({ error: 'This invite link has reached its usage limit' }, { status: 400 });
    }

    if (inviteLink.event.status === 'cancelled') {
      return NextResponse.json({ error: 'This event has been cancelled' }, { status: 400 });
    }

    // Check if user is on the invite list (for restricted links)
    let userIsInvited: boolean | null = null;
    if (user) {
      // Check by userId or email
      const invite = await prisma.eventInvite.findFirst({
        where: {
          eventId: inviteLink.eventId,
          OR: [
            { inviteeId: user.id },
            { inviteeEmail: user.email?.toLowerCase() },
          ],
        },
      });
      userIsInvited = !!invite;

      // Host is always considered invited
      if (inviteLink.event.hostId === user.id) {
        userIsInvited = true;
      }
    }

    // Build response
    const response: InviteLinkInfoResponse = {
      event: {
        id: inviteLink.event.id,
        title: inviteLink.event.title,
        description: inviteLink.event.description,
        coverImageUrl: inviteLink.event.coverImageUrl,
        startAt: inviteLink.event.startAt,
        endAt: inviteLink.event.endAt,
        locationName: inviteLink.event.locationName,
        locationMode: inviteLink.event.locationMode,
        status: inviteLink.event.status,
        attendingCount: inviteLink.event.attendingCount,
        maybeCount: inviteLink.event.maybeCount,
        host: inviteLink.event.host,
      },
      isRestricted: inviteLink.isRestricted,
      userIsInvited,
    };

    // If restricted and user is logged in but not invited, add error
    if (inviteLink.isRestricted && user && !userIsInvited) {
      response.error = 'restricted_not_invited';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get invite link info error:', error);
    return NextResponse.json({ error: 'Failed to fetch invite link info' }, { status: 500 });
  }
}

// POST /api/events/join/[token] - Redeem invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to join an event' }, { status: 401 });
    }

    const inviteLink = await prisma.eventInviteLink.findUnique({
      where: { token },
      include: {
        event: {
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
        },
      },
    });

    if (!inviteLink) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    // Check if link is usable
    const now = new Date();
    const isExpired = inviteLink.expiresAt ? inviteLink.expiresAt < now : false;
    const remainingUses = inviteLink.maxUses - inviteLink.usedCount;

    if (inviteLink.isRevoked) {
      return NextResponse.json({ error: 'This invite link has been revoked' }, { status: 400 });
    }

    if (isExpired) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 });
    }

    if (remainingUses <= 0) {
      return NextResponse.json({ error: 'This invite link has reached its usage limit' }, { status: 400 });
    }

    if (inviteLink.event.status !== 'scheduled') {
      return NextResponse.json({ error: 'This event is no longer accepting RSVPs' }, { status: 400 });
    }

    // Check if user is the host
    if (inviteLink.event.hostId === user.id) {
      return NextResponse.json({ error: 'You are the host of this event' }, { status: 400 });
    }

    // Check restriction if link is restricted
    let matchingEmailInvite: { id: string; inviteeEmail: string } | null = null;
    if (inviteLink.isRestricted) {
      // Check if user is on the invite list
      const invite = await prisma.eventInvite.findFirst({
        where: {
          eventId: inviteLink.eventId,
          OR: [
            { inviteeId: user.id },
            { inviteeEmail: user.email?.toLowerCase() },
          ],
        },
        select: { id: true, inviteeId: true, inviteeEmail: true },
      });

      if (!invite) {
        return NextResponse.json(
          { error: 'restricted_not_invited', message: 'You are not on the guest list for this event' },
          { status: 403 }
        );
      }

      // If matched by email (not userId), we'll claim it later
      if (!invite.inviteeId && invite.inviteeEmail) {
        matchingEmailInvite = { id: invite.id, inviteeEmail: invite.inviteeEmail };
      }
    }

    // Check if user already redeemed this link
    const existingRedemption = await prisma.eventInviteLinkRedemption.findUnique({
      where: {
        inviteLinkId_userId: {
          inviteLinkId: inviteLink.id,
          userId: user.id,
        },
      },
    });

    if (existingRedemption) {
      // Already redeemed, just return success with existing RSVP
      const existingRsvp = await prisma.eventRsvp.findUnique({
        where: {
          eventId_userId: {
            eventId: inviteLink.eventId,
            userId: user.id,
          },
        },
      });

      const response: RedeemInviteLinkResponse = {
        success: true,
        event: {
          id: inviteLink.event.id,
          title: inviteLink.event.title,
          description: inviteLink.event.description,
          coverImageUrl: inviteLink.event.coverImageUrl,
          startAt: inviteLink.event.startAt,
          endAt: inviteLink.event.endAt,
          locationName: inviteLink.event.locationName,
          locationMode: inviteLink.event.locationMode,
          status: inviteLink.event.status,
          attendingCount: inviteLink.event.attendingCount,
          maybeCount: inviteLink.event.maybeCount,
          host: inviteLink.event.host,
        },
        rsvpStatus: existingRsvp?.status || 'no_response',
      };

      return NextResponse.json(response);
    }

    // Redeem the link
    const result = await prisma.$transaction(async (tx) => {
      // Create redemption record
      await tx.eventInviteLinkRedemption.create({
        data: {
          inviteLinkId: inviteLink.id,
          userId: user.id,
        },
      });

      // Increment used count
      await tx.eventInviteLink.update({
        where: { id: inviteLink.id },
        data: { usedCount: { increment: 1 } },
      });

      // If this is an email invite being claimed, update it
      if (matchingEmailInvite) {
        await tx.eventInvite.update({
          where: { id: matchingEmailInvite.id },
          data: {
            inviteeId: user.id,
            claimedAt: new Date(),
            claimedById: user.id,
          },
        });
      }

      // Create RSVP with no_response status (if doesn't exist)
      const rsvp = await tx.eventRsvp.upsert({
        where: {
          eventId_userId: {
            eventId: inviteLink.eventId,
            userId: user.id,
          },
        },
        create: {
          eventId: inviteLink.eventId,
          userId: user.id,
          status: 'no_response',
        },
        update: {}, // Don't change existing RSVP
      });

      // Increment invited count
      await tx.event.update({
        where: { id: inviteLink.eventId },
        data: { invitedCount: { increment: 1 } },
      });

      return rsvp;
    });

    const response: RedeemInviteLinkResponse = {
      success: true,
      event: {
        id: inviteLink.event.id,
        title: inviteLink.event.title,
        description: inviteLink.event.description,
        coverImageUrl: inviteLink.event.coverImageUrl,
        startAt: inviteLink.event.startAt,
        endAt: inviteLink.event.endAt,
        locationName: inviteLink.event.locationName,
        locationMode: inviteLink.event.locationMode,
        status: inviteLink.event.status,
        attendingCount: inviteLink.event.attendingCount,
        maybeCount: inviteLink.event.maybeCount,
        host: inviteLink.event.host,
      },
      rsvpStatus: result.status,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Redeem invite link error:', error);
    return NextResponse.json({ error: 'Failed to redeem invite link' }, { status: 500 });
  }
}
