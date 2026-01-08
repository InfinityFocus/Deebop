import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/drops/[id] - Get drop details (for both posts and albums)
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'post'; // 'post' or 'album'

    if (type === 'album') {
      // Get album drop
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
          items: {
            take: 4,
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              thumbnailUrl: true,
              mediaUrl: true,
            },
          },
        },
      });

      if (!album) {
        return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
      }

      // Check visibility permissions
      const canView = await canViewScheduledAlbum(album, user.id);
      if (!canView) {
        return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
      }

      return NextResponse.json({
        drop: {
          id: album.id,
          type: 'album',
          content_type: 'album',
          title: album.title,
          description: album.description,
          preview_url: album.hideTeaser ? null : (album.coverImageUrl || album.items[0]?.thumbnailUrl || album.items[0]?.mediaUrl || null),
          preview_items: album.hideTeaser ? [] : album.items.map((item) => ({
            id: item.id,
            thumbnail_url: item.thumbnailUrl || item.mediaUrl,
          })),
          hide_teaser: album.hideTeaser,
          visibility: album.visibility,
          status: album.status,
          scheduled_for: album.scheduledFor?.toISOString() || null,
          dropped_at: album.droppedAt?.toISOString() || null,
          created_at: album.createdAt.toISOString(),
          creator: {
            id: album.owner.id,
            username: album.owner.username,
            display_name: album.owner.displayName,
            avatar_url: album.owner.avatarUrl,
          },
          is_own: album.ownerId === user.id,
        },
      });
    }

    // Default: get post drop
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    // Check visibility permissions
    const canView = await canViewScheduledPost(post, user.id);
    if (!canView) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    return NextResponse.json({
      drop: {
        id: post.id,
        type: 'post',
        content_type: post.contentType,
        title: post.headline,
        headline_style: post.headlineStyle,
        description: post.description,
        preview_url: post.hideTeaser ? null : (post.mediaThumbnailUrl || post.mediaUrl),
        hide_teaser: post.hideTeaser,
        visibility: post.visibility,
        provenance: post.provenance,
        status: post.status,
        scheduled_for: post.scheduledFor?.toISOString() || null,
        dropped_at: post.droppedAt?.toISOString() || null,
        created_at: post.createdAt.toISOString(),
        creator: {
          id: post.user.id,
          username: post.user.username,
          display_name: post.user.displayName,
          avatar_url: post.user.avatarUrl,
          tier: post.user.tier,
        },
        is_own: post.userId === user.id,
      },
    });
  } catch (error) {
    console.error('Get drop error:', error);
    return NextResponse.json({ error: 'Failed to fetch drop' }, { status: 500 });
  }
}

// Helper to check if user can view a scheduled post
async function canViewScheduledPost(post: any, userId: string): Promise<boolean> {
  // Owner can always view
  if (post.userId === userId) return true;

  // Public posts
  if (post.visibility === 'public') return true;

  // Followers-only posts
  if (post.visibility === 'followers') {
    const isFollower = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: post.userId,
        },
      },
    });
    return !!isFollower;
  }

  // Private posts - check audience
  if (post.visibility === 'private') {
    const inAudienceUsers = await prisma.postAudienceUser.findUnique({
      where: { postId_userId: { postId: post.id, userId } },
    });
    if (inAudienceUsers) return true;

    const inAudienceGroup = await prisma.postAudienceGroup.findFirst({
      where: {
        postId: post.id,
        group: { members: { some: { userId } } },
      },
    });
    if (inAudienceGroup) return true;
  }

  return false;
}

// Helper to check if user can view a scheduled album
async function canViewScheduledAlbum(album: any, userId: string): Promise<boolean> {
  // Owner can always view
  if (album.ownerId === userId) return true;

  // Public albums
  if (album.visibility === 'public') return true;

  // Followers-only albums
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

  // Private albums - check audience
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
