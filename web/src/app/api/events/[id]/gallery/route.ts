import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { buildEventContext, canViewGallery } from '@/lib/event-permissions';

// GET /api/events/[id]/gallery - Get linked album for event
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
        album: {
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                uploader: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            members: {
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
            },
          },
        },
        rsvps: user ? {
          where: { userId: user.id },
          take: 1,
        } : false,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.album) {
      return NextResponse.json({ error: 'Event has no gallery' }, { status: 404 });
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

    // Check gallery access permission
    if (!canViewGallery(ctx)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format album response
    return NextResponse.json({
      album: {
        id: event.album.id,
        title: event.album.title,
        description: event.album.description,
        coverImageUrl: event.album.coverImageUrl,
        itemsCount: event.album.itemsCount,
        createdAt: event.album.createdAt,
        items: event.album.items.map((item) => ({
          id: item.id,
          contentType: item.contentType,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          mediaWidth: item.mediaWidth,
          mediaHeight: item.mediaHeight,
          caption: item.caption,
          provenance: item.provenance,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt,
          uploader: item.uploader,
        })),
        members: event.album.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          user: m.user,
        })),
      },
      eventId: event.id,
      eventTitle: event.title,
    });
  } catch (error) {
    console.error('Get event gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch event gallery' }, { status: 500 });
  }
}
