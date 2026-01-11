import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import type { SendInvitesPayload } from '@/types/event';

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/events/[id]/invites - Send in-app invites to users or emails
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

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only host can send invites
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can send invites' }, { status: 403 });
    }

    // Cannot send invites for cancelled events
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot invite to a cancelled event' }, { status: 400 });
    }

    const body: SendInvitesPayload = await request.json();
    const { userIds = [], emails = [], message } = body;

    if ((!userIds || userIds.length === 0) && (!emails || emails.length === 0)) {
      return NextResponse.json({ error: 'At least one user ID or email is required' }, { status: 400 });
    }

    // Validate and normalize emails
    const normalizedEmails = (emails || [])
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => EMAIL_REGEX.test(e));

    // Check which emails belong to existing users
    const usersWithEmails = normalizedEmails.length > 0
      ? await prisma.user.findMany({
          where: { email: { in: normalizedEmails } },
          select: { id: true, email: true },
        })
      : [];

    const emailToUserMap = new Map(usersWithEmails.map((u) => [u.email, u.id]));

    // Split emails: existing users -> userIds, non-registered -> pureEmails
    const emailUserIds: string[] = [];
    const pureEmails: string[] = [];

    for (const email of normalizedEmails) {
      const existingUserId = emailToUserMap.get(email);
      if (existingUserId) {
        emailUserIds.push(existingUserId);
      } else {
        pureEmails.push(email);
      }
    }

    // Combine all user IDs
    const allUserIds = [...new Set([...(userIds || []), ...emailUserIds])];

    // Build OR conditions for existing invite check
    const orConditions: object[] = [];
    if (allUserIds.length > 0) {
      orConditions.push({ inviteeId: { in: allUserIds } });
    }
    if (pureEmails.length > 0) {
      orConditions.push({ inviteeEmail: { in: pureEmails } });
    }

    const existingInvites = orConditions.length > 0
      ? await prisma.eventInvite.findMany({
          where: { eventId: id, OR: orConditions },
          select: { inviteeId: true, inviteeEmail: true },
        })
      : [];

    const alreadyInvitedUserIds = new Set(
      existingInvites.filter((i) => i.inviteeId).map((i) => i.inviteeId)
    );
    const alreadyInvitedEmails = new Set(
      existingInvites.filter((i) => i.inviteeEmail).map((i) => i.inviteeEmail)
    );

    // Filter out already invited and self
    const newUserIds = allUserIds.filter(
      (uid) => !alreadyInvitedUserIds.has(uid) && uid !== user.id
    );
    const newEmails = pureEmails.filter((e) => !alreadyInvitedEmails.has(e));

    if (newUserIds.length === 0 && newEmails.length === 0) {
      return NextResponse.json({ error: 'All users/emails are already invited' }, { status: 400 });
    }

    // Verify users exist
    const validUsers = newUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: newUserIds } },
          select: { id: true },
        })
      : [];
    const validUserIds = validUsers.map((u) => u.id);

    // Create invites and initial RSVPs
    const result = await prisma.$transaction(async (tx) => {
      let userInviteCount = 0;
      let emailInviteCount = 0;

      // Create user invites
      if (validUserIds.length > 0) {
        await tx.eventInvite.createMany({
          data: validUserIds.map((inviteeId) => ({
            eventId: id,
            inviterId: user.id,
            inviteeId,
            message: message?.trim() || null,
          })),
        });

        await tx.eventRsvp.createMany({
          data: validUserIds.map((userId) => ({
            eventId: id,
            userId,
            status: 'no_response',
          })),
          skipDuplicates: true,
        });

        userInviteCount = validUserIds.length;
      }

      // Create email-only invites
      if (newEmails.length > 0) {
        await tx.eventInvite.createMany({
          data: newEmails.map((email) => ({
            eventId: id,
            inviterId: user.id,
            inviteeEmail: email,
            message: message?.trim() || null,
          })),
        });

        emailInviteCount = newEmails.length;
      }

      // Update invited count
      const totalNew = userInviteCount + emailInviteCount;
      if (totalNew > 0) {
        await tx.event.update({
          where: { id },
          data: { invitedCount: { increment: totalNew } },
        });
      }

      return { userInviteCount, emailInviteCount };
    });

    // Create notifications for invited users (outside transaction so invites work even if notifications fail)
    if (validUserIds.length > 0) {
      try {
        await prisma.notification.createMany({
          data: validUserIds.map((inviteeId) => ({
            userId: inviteeId,
            type: 'event_invite',
            actorId: user.id,
            eventId: id,
          })),
        });
      } catch (notificationError) {
        // Log but don't fail the invite - notifications are non-critical
        console.error('Failed to create invite notifications:', notificationError);
      }
    }

    const total = result.userInviteCount + result.emailInviteCount;

    return NextResponse.json({
      success: true,
      invitedCount: total,
      userInviteCount: result.userInviteCount,
      emailInviteCount: result.emailInviteCount,
    });
  } catch (error) {
    console.error('Send invites error:', error);
    return NextResponse.json({ error: 'Failed to send invites' }, { status: 500 });
  }
}

// GET /api/events/[id]/invites - List all invites (host only)
export async function GET(
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

    // Only host can see all invites
    if (event.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can view invites' }, { status: 403 });
    }

    const invites = await prisma.eventInvite.findMany({
      where: { eventId: id },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get RSVP status for each invitee (user invites only)
    const userInviteeIds = invites
      .filter((i) => i.inviteeId)
      .map((i) => i.inviteeId as string);

    const rsvps = userInviteeIds.length > 0
      ? await prisma.eventRsvp.findMany({
          where: {
            eventId: id,
            userId: { in: userInviteeIds },
          },
        })
      : [];

    const rsvpMap = new Map(rsvps.map((r) => [r.userId, r.status]));

    const formattedInvites = invites.map((invite) => ({
      id: invite.id,
      eventId: invite.eventId,
      inviteeId: invite.inviteeId,
      inviteeEmail: invite.inviteeEmail,
      message: invite.message,
      createdAt: invite.createdAt,
      claimedAt: invite.claimedAt,
      invitee: invite.invitee,
      claimedBy: invite.claimedBy,
      rsvpStatus: invite.inviteeId ? rsvpMap.get(invite.inviteeId) || 'no_response' : null,
      isEmailInvite: !invite.inviteeId && !!invite.inviteeEmail,
      isClaimed: !!invite.claimedAt,
    }));

    return NextResponse.json({ invites: formattedInvites });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}
