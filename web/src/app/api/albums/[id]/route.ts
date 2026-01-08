import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { hasAlbumPermission } from '@/lib/album-permissions';
import { AlbumRole } from '@prisma/client';
import { buildEventContext, canUploadToGallery } from '@/lib/event-permissions';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

// Helper to get user's role in an album
async function getUserAlbumRole(albumId: string, userId: string): Promise<AlbumRole | null> {
  const member = await prisma.albumMember.findUnique({
    where: {
      albumId_userId: {
        albumId,
        userId,
      },
    },
  });
  return member?.role || null;
}

// Helper to check if user can view album
async function canViewAlbum(album: any, userId: string | null, isAdmin: boolean): Promise<boolean> {
  // Admins can view all albums
  if (isAdmin) return true;

  // Public albums visible to all
  if (album.visibility === 'public') return true;

  if (!userId) return false;

  // Owner and members can always view
  if (album.ownerId === userId) return true;

  const isMember = await prisma.albumMember.findUnique({
    where: { albumId_userId: { albumId: album.id, userId } },
  });
  if (isMember) return true;

  // Followers visibility
  if (album.visibility === 'followers') {
    const isFollower = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: album.ownerId,
        },
      },
    });
    return !!isFollower;
  }

  // Private visibility - check audience
  if (album.visibility === 'private') {
    const inAudienceUsers = await prisma.albumAudienceUser.findUnique({
      where: { albumId_userId: { albumId: album.id, userId } },
    });
    if (inAudienceUsers) return true;

    const inAudienceGroup = await prisma.albumAudienceGroup.findFirst({
      where: {
        albumId: album.id,
        group: { members: { some: { userId } } },
      },
    });
    if (inAudienceGroup) return true;
  }

  return false;
}

// GET /api/albums/[id] - Get album details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
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
          orderBy: { joinedAt: 'asc' },
        },
        hashtags: {
          include: {
            hashtag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
        saves: user ? { where: { userId: user.id }, select: { userId: true } } : false,
        linkedEvent: {
          select: {
            id: true,
            status: true,
            visibility: true,
            hostId: true,
            rsvpLocked: true,
            rsvpDeadlineAt: true,
            startAt: true,
            endAt: true,
            showAttendeeList: true,
            allowMaybeUploads: true,
            uploadWindow: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check visibility (admins can view all albums)
    const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
    const canView = await canViewAlbum(album, user?.id || null, isAdmin);
    if (!canView) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Get user's role if authenticated
    const userRole = user ? await getUserAlbumRole(album.id, user.id) : null;

    // Check event upload permissions and fetch attendees if this is an event album
    let canUploadToEvent: boolean | null = null;
    let eventAttendees: { attending: any[]; maybe: any[] } | null = null;
    let eventHost: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null = null;
    let canViewAttendeeList = false;

    if (album.linkedEvent) {
      // Fetch event host info
      const host = await prisma.user.findUnique({
        where: { id: album.linkedEvent.hostId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      if (host) {
        eventHost = {
          id: host.id,
          username: host.username,
          display_name: host.displayName,
          avatar_url: host.avatarUrl,
        };
      }

      if (user) {
        // Get user's RSVP status and invite status for the event
        const [rsvp, invite, linkRedemption, follow] = await Promise.all([
          prisma.eventRsvp.findUnique({
            where: { eventId_userId: { eventId: album.linkedEvent.id, userId: user.id } },
          }),
          prisma.eventInvite.findFirst({
            where: { eventId: album.linkedEvent.id, inviteeId: user.id },
          }),
          prisma.eventInviteLinkRedemption.findFirst({
            where: { inviteLink: { eventId: album.linkedEvent.id }, userId: user.id },
          }),
          prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: user.id, followingId: album.linkedEvent.hostId } },
          }),
        ]);

        const eventCtx = buildEventContext({
          event: album.linkedEvent,
          userId: user.id,
          rsvpStatus: rsvp?.status ?? null,
          isInvited: !!invite || !!linkRedemption,
          isFollower: !!follow,
        });

        canUploadToEvent = canUploadToGallery(eventCtx);

        // Determine if user can view attendee list
        // Host can always see, otherwise check showAttendeeList setting
        const isEventHost = album.linkedEvent.hostId === user.id;
        const isInvited = !!invite || !!linkRedemption || !!rsvp;

        if (isEventHost || isAdmin) {
          canViewAttendeeList = true;
        } else if (album.linkedEvent.showAttendeeList) {
          // If showAttendeeList is true, invited users can see the list
          canViewAttendeeList = isInvited;
        }
      }

      // Fetch event attendees if user can view them
      if (canViewAttendeeList) {
        const rsvps = await prisma.eventRsvp.findMany({
          where: {
            eventId: album.linkedEvent.id,
            status: { in: ['attending', 'maybe'] },
            // Exclude the host from attendees (they're shown separately)
            userId: { not: album.linkedEvent.hostId },
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
          orderBy: { createdAt: 'asc' },
        });

        const attending = rsvps
          .filter((r) => r.status === 'attending')
          .map((r) => ({
            id: r.user.id,
            username: r.user.username,
            display_name: r.user.displayName,
            avatar_url: r.user.avatarUrl,
            rsvp_at: r.createdAt.toISOString(),
          }));

        const maybe = rsvps
          .filter((r) => r.status === 'maybe')
          .map((r) => ({
            id: r.user.id,
            username: r.user.username,
            display_name: r.user.displayName,
            avatar_url: r.user.avatarUrl,
            rsvp_at: r.createdAt.toISOString(),
          }));

        eventAttendees = { attending, maybe };
      }
    }

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.title,
        description: album.description,
        cover_image_url: album.coverImageUrl || album.items[0]?.thumbnailUrl || album.items[0]?.mediaUrl || null,
        visibility: album.visibility,
        status: album.status,
        scheduled_for: album.scheduledFor?.toISOString() || null,
        dropped_at: album.droppedAt?.toISOString() || null,
        hide_teaser: album.hideTeaser,
        location: album.location,
        items_count: album.itemsCount,
        members_count: album.membersCount,
        likes_count: album.likesCount,
        saves_count: album.savesCount,
        views_count: album.viewsCount,
        created_at: album.createdAt.toISOString(),
        updated_at: album.updatedAt.toISOString(),
        owner: {
          id: album.owner.id,
          username: album.owner.username,
          display_name: album.owner.displayName,
          avatar_url: album.owner.avatarUrl,
        },
        members: album.members.map((m) => ({
          id: m.id,
          role: m.role,
          joined_at: m.joinedAt.toISOString(),
          user: {
            id: m.user.id,
            username: m.user.username,
            display_name: m.user.displayName,
            avatar_url: m.user.avatarUrl,
          },
        })),
        hashtags: album.hashtags.map((h) => h.hashtag.name),
        items: album.items.map((item) => ({
          id: item.id,
          content_type: item.contentType,
          media_url: item.mediaUrl,
          thumbnail_url: item.thumbnailUrl,
          media_width: item.mediaWidth,
          media_height: item.mediaHeight,
          caption: item.caption,
          provenance: item.provenance,
          sort_order: item.sortOrder,
          created_at: item.createdAt.toISOString(),
          uploader: {
            id: item.uploader.id,
            username: item.uploader.username,
            display_name: item.uploader.displayName,
            avatar_url: item.uploader.avatarUrl,
          },
        })),
        is_liked: user ? (Array.isArray(album.likes) && album.likes.length > 0) : false,
        is_saved: user ? (Array.isArray(album.saves) && album.saves.length > 0) : false,
        user_role: userRole,
        linked_event_id: album.linkedEvent?.id || null,
        can_upload_to_event: canUploadToEvent,
        // Event album specific data
        event_host: eventHost,
        event_attendees: eventAttendees,
        can_view_attendee_list: canViewAttendeeList,
      },
    });
  } catch (error) {
    console.error('Get album error:', error);
    return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
  }
}

// PATCH /api/albums/[id] - Update album metadata
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

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check permission
    const userRole = await getUserAlbumRole(id, user.id);
    if (!hasAlbumPermission(userRole, 'edit_metadata')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, visibility, location, coverImageUrl, hashtags, scheduled_for, hide_teaser, cancel_schedule } = body;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (visibility !== undefined) {
      if (!['public', 'followers', 'private'].includes(visibility)) {
        return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
      }
      updateData.visibility = visibility;
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null;
    }

    if (coverImageUrl !== undefined) {
      updateData.coverImageUrl = coverImageUrl || null;
    }

    // Handle scheduling updates (only for scheduled albums)
    if (cancel_schedule && album.status === 'scheduled') {
      // Cancel the scheduled drop - publish immediately
      updateData.status = 'published';
      updateData.scheduledFor = null;
      updateData.droppedAt = new Date();
    } else if (scheduled_for !== undefined && album.status === 'scheduled') {
      // Update scheduled time
      if (scheduled_for === null) {
        // Remove schedule - publish immediately
        updateData.status = 'published';
        updateData.scheduledFor = null;
        updateData.droppedAt = new Date();
      } else {
        const newScheduledFor = new Date(scheduled_for);
        if (isNaN(newScheduledFor.getTime())) {
          return NextResponse.json({ error: 'Invalid scheduled time' }, { status: 400 });
        }

        // Must be at least 5 minutes in the future
        const minScheduleTime = new Date(Date.now() + 5 * 60 * 1000);
        if (newScheduledFor < minScheduleTime) {
          return NextResponse.json(
            { error: 'Scheduled time must be at least 5 minutes in the future' },
            { status: 400 }
          );
        }

        updateData.scheduledFor = newScheduledFor;
      }
    }

    // Handle hide teaser update
    if (hide_teaser !== undefined) {
      updateData.hideTeaser = hide_teaser;
    }

    // Update album
    const updatedAlbum = await prisma.$transaction(async (tx) => {
      const updated = await tx.album.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Handle hashtags update if provided
      if (hashtags !== undefined) {
        // Remove existing hashtags
        await tx.albumHashtag.deleteMany({
          where: { albumId: id },
        });

        // Add new hashtags
        if (hashtags && hashtags.length > 0) {
          for (const tagName of hashtags) {
            const normalizedName = tagName.toLowerCase().replace(/^#/, '').trim();
            if (!normalizedName) continue;

            const hashtag = await tx.hashtag.upsert({
              where: { name: normalizedName },
              create: { name: normalizedName },
              update: {},
            });

            await tx.albumHashtag.create({
              data: {
                albumId: id,
                hashtagId: hashtag.id,
              },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({
      album: {
        id: updatedAlbum.id,
        title: updatedAlbum.title,
        description: updatedAlbum.description,
        cover_image_url: updatedAlbum.coverImageUrl,
        visibility: updatedAlbum.visibility,
        status: updatedAlbum.status,
        scheduled_for: updatedAlbum.scheduledFor?.toISOString() || null,
        dropped_at: updatedAlbum.droppedAt?.toISOString() || null,
        hide_teaser: updatedAlbum.hideTeaser,
        location: updatedAlbum.location,
        updated_at: updatedAlbum.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update album error:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// DELETE /api/albums/[id] - Delete album
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

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check permission - only owner can delete
    const userRole = await getUserAlbumRole(id, user.id);
    if (!hasAlbumPermission(userRole, 'delete_album')) {
      return NextResponse.json({ error: 'Only the album owner can delete this album' }, { status: 403 });
    }

    // Delete album and decrement user's count
    await prisma.$transaction(async (tx) => {
      await tx.album.delete({
        where: { id },
      });

      await tx.user.update({
        where: { id: album.ownerId },
        data: { albumsCount: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete album error:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
