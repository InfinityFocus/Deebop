import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ALBUM_LIMITS } from '@/lib/album-permissions';

// GET /api/albums - List albums (feed, owned, shared, saved)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'feed'; // feed, owned, shared, saved
    const userId = searchParams.get('userId'); // For profile pages

    // Build filter based on type
    let whereClause: any = {};

    if (type === 'owned') {
      // Albums owned by current user
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      whereClause = { ownerId: user.id };
    } else if (type === 'shared') {
      // Albums where user is a member (not owner)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      whereClause = {
        members: { some: { userId: user.id } },
        NOT: { ownerId: user.id },
      };
    } else if (type === 'saved') {
      // Albums saved by user
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      whereClause = {
        saves: { some: { userId: user.id } },
      };
    } else if (userId) {
      // Albums by specific user (for profile pages)
      whereClause = { ownerId: userId };
    } else {
      // Feed - all visible albums (default)
      // No additional filter, visibility handled below
    }

    // Build visibility filter
    const visibilityFilter = user
      ? {
          OR: [
            { visibility: 'public' as const },
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
            {
              AND: [
                { visibility: 'followers' as const },
                { owner: { followers: { some: { followerId: user.id } } } },
              ],
            },
            {
              AND: [
                { visibility: 'private' as const },
                { audienceUsers: { some: { userId: user.id } } },
              ],
            },
            {
              AND: [
                { visibility: 'private' as const },
                {
                  audienceGroups: {
                    some: { group: { members: { some: { userId: user.id } } } },
                  },
                },
              ],
            },
          ],
        }
      : { visibility: 'public' as const };

    const albums = await prisma.album.findMany({
      where: {
        ...whereClause,
        ...visibilityFilter,
        status: 'published', // Only show published albums, not scheduled drops
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
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
          take: 3,
          select: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        items: {
          take: 4,
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            thumbnailUrl: true,
            mediaUrl: true,
          },
        },
        likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
        saves: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      },
    });

    let nextCursor: string | undefined;
    if (albums.length > limit) {
      const nextItem = albums.pop();
      nextCursor = nextItem?.id;
    }

    const formattedAlbums = albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      cover_image_url: album.coverImageUrl || album.items[0]?.thumbnailUrl || album.items[0]?.mediaUrl || null,
      visibility: album.visibility,
      status: album.status,
      dropped_at: album.droppedAt?.toISOString() || null,
      location: album.location,
      items_count: album.itemsCount,
      members_count: album.membersCount,
      likes_count: album.likesCount,
      saves_count: album.savesCount,
      created_at: album.createdAt.toISOString(),
      owner: {
        id: album.owner.id,
        username: album.owner.username,
        display_name: album.owner.displayName,
        avatar_url: album.owner.avatarUrl,
      },
      preview_members: album.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        avatar_url: m.user.avatarUrl,
      })),
      preview_items: album.items.map((item) => ({
        id: item.id,
        thumbnail_url: item.thumbnailUrl || item.mediaUrl,
      })),
      is_liked: user ? (Array.isArray(album.likes) && album.likes.length > 0) : false,
      is_saved: user ? (Array.isArray(album.saves) && album.saves.length > 0) : false,
    }));

    return NextResponse.json({
      albums: formattedAlbums,
      nextCursor,
    });
  } catch (error) {
    console.error('Get albums error:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// POST /api/albums - Create a new album
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier limits
    const existingCount = await prisma.album.count({
      where: { ownerId: user.id },
    });

    const limit = ALBUM_LIMITS[user.tier];
    if (existingCount >= limit) {
      return NextResponse.json(
        { error: `Album limit reached (${limit}). Upgrade to create more albums.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, visibility, location, hashtags, audienceUserIds, audienceGroupIds, scheduledFor, hideTeaser } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Parse and validate scheduled time
    let status: 'published' | 'scheduled' = 'published';
    let parsedScheduledFor: Date | null = null;

    if (scheduledFor) {
      parsedScheduledFor = new Date(scheduledFor);
      if (isNaN(parsedScheduledFor.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduled time' }, { status: 400 });
      }

      // Must be at least 5 minutes in the future
      const minScheduleTime = new Date(Date.now() + 5 * 60 * 1000);
      if (parsedScheduledFor < minScheduleTime) {
        return NextResponse.json(
          { error: 'Scheduled time must be at least 5 minutes in the future' },
          { status: 400 }
        );
      }

      status = 'scheduled';
    }

    // Validate visibility
    if (visibility && !['public', 'followers', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }

    // For private albums, validate audience
    if (visibility === 'private') {
      const hasAudience = (audienceUserIds?.length > 0) || (audienceGroupIds?.length > 0);
      if (!hasAudience) {
        return NextResponse.json(
          { error: 'Private albums must have at least one audience member or group' },
          { status: 400 }
        );
      }
    }

    // Create album with owner as member
    const album = await prisma.$transaction(async (tx) => {
      // Create the album
      const newAlbum = await tx.album.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          visibility: visibility || 'public',
          location: location?.trim() || null,
          ownerId: user.id,
          status,
          scheduledFor: parsedScheduledFor,
          hideTeaser: hideTeaser || false,
        },
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

      // Add owner as member with owner role
      await tx.albumMember.create({
        data: {
          albumId: newAlbum.id,
          userId: user.id,
          role: 'owner',
        },
      });

      // Handle hashtags
      if (hashtags && hashtags.length > 0) {
        for (const tagName of hashtags) {
          const normalizedName = tagName.toLowerCase().replace(/^#/, '').trim();
          if (!normalizedName) continue;

          // Find or create hashtag
          const hashtag = await tx.hashtag.upsert({
            where: { name: normalizedName },
            create: { name: normalizedName },
            update: {},
          });

          // Link to album
          await tx.albumHashtag.create({
            data: {
              albumId: newAlbum.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      // Handle private audience
      if (visibility === 'private') {
        if (audienceUserIds?.length > 0) {
          await tx.albumAudienceUser.createMany({
            data: audienceUserIds.map((userId: string) => ({
              albumId: newAlbum.id,
              userId,
            })),
          });
        }

        if (audienceGroupIds?.length > 0) {
          await tx.albumAudienceGroup.createMany({
            data: audienceGroupIds.map((groupId: string) => ({
              albumId: newAlbum.id,
              groupId,
            })),
          });
        }
      }

      // Increment user's album count
      await tx.user.update({
        where: { id: user.id },
        data: { albumsCount: { increment: 1 } },
      });

      return newAlbum;
    });

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.title,
        description: album.description,
        cover_image_url: album.coverImageUrl,
        visibility: album.visibility,
        status: album.status,
        scheduled_for: album.scheduledFor?.toISOString() || null,
        hide_teaser: album.hideTeaser,
        location: album.location,
        items_count: album.itemsCount,
        members_count: album.membersCount,
        created_at: album.createdAt.toISOString(),
        owner: {
          id: album.owner.id,
          username: album.owner.username,
          display_name: album.owner.displayName,
          avatar_url: album.owner.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error('Create album error:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
