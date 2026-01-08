import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { hasAlbumPermission } from '@/lib/album-permissions';
import { buildEventContext, canUploadToGallery, canViewGallery } from '@/lib/event-permissions';
import { uploadToMinio, generateFileKey } from '@/lib/minio';
import { AlbumRole } from '@prisma/client';

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

// GET /api/albums/[id]/items - List album items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check album exists and user can view
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, visibility: true, ownerId: true, albumType: true, linkedEvent: true },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // For event albums, use event permissions
    if (album.albumType === 'event' && album.linkedEvent) {
      const event = album.linkedEvent;

      // Check if user is invited
      let isInvited = false;
      if (user) {
        const invite = await prisma.eventInvite.findFirst({
          where: { eventId: event.id, inviteeId: user.id },
        });
        if (invite) {
          isInvited = true;
        } else {
          const redemption = await prisma.eventInviteLinkRedemption.findFirst({
            where: {
              userId: user.id,
              inviteLink: { eventId: event.id },
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
      let rsvpStatus = null;
      if (user) {
        const rsvp = await prisma.eventRsvp.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: user.id,
            },
          },
        });
        rsvpStatus = rsvp?.status ?? null;
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
        rsvpStatus,
        isInvited,
        isFollower,
      });

      if (!canViewGallery(ctx)) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }
    } else if (album.visibility !== 'public') {
      // For non-public standard albums, check access
      if (!user) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      const userRole = await getUserAlbumRole(albumId, user.id);
      if (!userRole && album.ownerId !== user.id) {
        // Check if in audience
        const inAudience = await prisma.albumAudienceUser.findUnique({
          where: { albumId_userId: { albumId, userId: user.id } },
        });

        if (!inAudience) {
          const inGroup = await prisma.albumAudienceGroup.findFirst({
            where: {
              albumId,
              group: { members: { some: { userId: user.id } } },
            },
          });

          if (!inGroup && album.visibility !== 'followers') {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 });
          }

          // Check follower status for followers visibility
          if (album.visibility === 'followers' && !inGroup) {
            const isFollower = await prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: user.id,
                  followingId: album.ownerId,
                },
              },
            });
            if (!isFollower) {
              return NextResponse.json({ error: 'Album not found' }, { status: 404 });
            }
          }
        }
      }
    }

    const items = await prisma.albumItem.findMany({
      where: { albumId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
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
    });

    let nextCursor: string | undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      items: items.map((item) => ({
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
      nextCursor,
    });
  } catch (error) {
    console.error('Get album items error:', error);
    return NextResponse.json({ error: 'Failed to fetch album items' }, { status: 500 });
  }
}

// POST /api/albums/[id]/items - Add item to album
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check album exists with event info
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        linkedEvent: true,
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check permission - different logic for event albums
    if (album.albumType === 'event' && album.linkedEvent) {
      // Event album - use event permissions
      const event = album.linkedEvent;

      // Check if user is invited
      let isInvited = false;
      const invite = await prisma.eventInvite.findFirst({
        where: { eventId: event.id, inviteeId: user.id },
      });
      if (invite) {
        isInvited = true;
      } else {
        const redemption = await prisma.eventInviteLinkRedemption.findFirst({
          where: {
            userId: user.id,
            inviteLink: { eventId: event.id },
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

      // Get user's RSVP status
      const rsvp = await prisma.eventRsvp.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: user.id,
          },
        },
      });

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
        rsvpStatus: rsvp?.status ?? null,
        isInvited,
        isFollower,
      });

      if (!canUploadToGallery(ctx)) {
        return NextResponse.json({ error: 'You do not have permission to upload to this event gallery' }, { status: 403 });
      }
    } else {
      // Standard album - use album permissions
      const userRole = await getUserAlbumRole(albumId, user.id);
      if (!hasAlbumPermission(userRole, 'upload')) {
        return NextResponse.json({ error: 'You do not have permission to upload to this album' }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const contentType = formData.get('content_type') as 'image' | 'video' | 'panorama360';
    const caption = formData.get('caption') as string | null;
    const provenance = formData.get('provenance') as string | null;
    const media = formData.get('media') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;

    // Validate content type (only media, no shouts)
    if (!contentType || !['image', 'video', 'panorama360'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type. Albums only support image, video, and panorama360.' }, { status: 400 });
    }

    // Validate media file
    if (!media) {
      return NextResponse.json({ error: 'Media file is required' }, { status: 400 });
    }

    // Upload media
    const buffer = Buffer.from(await media.arrayBuffer());
    const key = generateFileKey(user.id, `album-${albumId}`, media.name);
    const mediaUrl = await uploadToMinio(key, buffer, media.type);

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnail) {
      const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer());
      const thumbKey = generateFileKey(user.id, `album-${albumId}-thumb`, thumbnail.name);
      thumbnailUrl = await uploadToMinio(thumbKey, thumbBuffer, thumbnail.type);
    }

    // Get next sort order
    const maxSortOrder = await prisma.albumItem.aggregate({
      where: { albumId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    // Create item and update album count
    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.albumItem.create({
        data: {
          albumId,
          uploaderId: user.id,
          contentType,
          mediaUrl,
          thumbnailUrl,
          caption: caption?.trim() || null,
          provenance: (provenance as any) || 'original',
          sortOrder: nextSortOrder,
        },
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
      });

      // Increment album items count
      await tx.album.update({
        where: { id: albumId },
        data: { itemsCount: { increment: 1 } },
      });

      return newItem;
    });

    return NextResponse.json({
      item: {
        id: item.id,
        content_type: item.contentType,
        media_url: item.mediaUrl,
        thumbnail_url: item.thumbnailUrl,
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
      },
    });
  } catch (error) {
    console.error('Add album item error:', error);
    return NextResponse.json({ error: 'Failed to add item to album' }, { status: 500 });
  }
}
