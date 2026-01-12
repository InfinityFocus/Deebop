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

// PUT /api/drops/[id] - Update a scheduled drop
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'post', scheduledFor, hideTeaser, headline, description } = body;

    if (type === 'album') {
      // Update album drop
      const album = await prisma.album.findUnique({
        where: { id },
      });

      if (!album) {
        return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
      }

      if (album.ownerId !== user.id) {
        return NextResponse.json({ error: 'You can only edit your own drops' }, { status: 403 });
      }

      if (album.status !== 'scheduled') {
        return NextResponse.json({ error: 'Can only edit scheduled drops' }, { status: 400 });
      }

      // Validate scheduled time if provided
      let newScheduledFor = album.scheduledFor;
      if (scheduledFor) {
        newScheduledFor = new Date(scheduledFor);
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
      }

      const updatedAlbum = await prisma.album.update({
        where: { id },
        data: {
          scheduledFor: newScheduledFor,
          hideTeaser: hideTeaser !== undefined ? hideTeaser : album.hideTeaser,
          title: headline?.trim() || album.title,
          description: description !== undefined ? description?.trim() || null : album.description,
        },
      });

      return NextResponse.json({
        message: 'Drop updated',
        drop: {
          id: updatedAlbum.id,
          type: 'album',
          scheduled_for: updatedAlbum.scheduledFor?.toISOString(),
          hide_teaser: updatedAlbum.hideTeaser,
        },
      });
    }

    // Default: update post drop
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own drops' }, { status: 403 });
    }

    if (post.status !== 'scheduled') {
      return NextResponse.json({ error: 'Can only edit scheduled drops' }, { status: 400 });
    }

    // Validate scheduled time if provided
    let newScheduledFor = post.scheduledFor;
    if (scheduledFor) {
      newScheduledFor = new Date(scheduledFor);
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
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        scheduledFor: newScheduledFor,
        hideTeaser: hideTeaser !== undefined ? hideTeaser : post.hideTeaser,
        headline: headline !== undefined ? headline?.trim() || null : post.headline,
        description: description !== undefined ? description?.trim() || null : post.description,
      },
    });

    return NextResponse.json({
      message: 'Drop updated',
      drop: {
        id: updatedPost.id,
        type: 'post',
        scheduled_for: updatedPost.scheduledFor?.toISOString(),
        hide_teaser: updatedPost.hideTeaser,
      },
    });
  } catch (error) {
    console.error('Update drop error:', error);
    return NextResponse.json({ error: 'Failed to update drop' }, { status: 500 });
  }
}

// DELETE /api/drops/[id] - Delete/cancel a scheduled drop
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'post';

    if (type === 'album') {
      const album = await prisma.album.findUnique({
        where: { id },
      });

      if (!album) {
        return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
      }

      if (album.ownerId !== user.id) {
        return NextResponse.json({ error: 'You can only delete your own drops' }, { status: 403 });
      }

      if (album.status !== 'scheduled') {
        return NextResponse.json({ error: 'Can only delete scheduled drops' }, { status: 400 });
      }

      await prisma.album.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Drop cancelled' });
    }

    // Default: delete post drop
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own drops' }, { status: 403 });
    }

    if (post.status !== 'scheduled') {
      return NextResponse.json({ error: 'Can only delete scheduled drops' }, { status: 400 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Drop cancelled' });
  } catch (error) {
    console.error('Delete drop error:', error);
    return NextResponse.json({ error: 'Failed to delete drop' }, { status: 500 });
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
