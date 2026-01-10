import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/posts/[id] - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

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
        _count: {
          select: {
            likes: true,
            saves: true,
            shares: true,
          },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            thumbnailUrl: true,
            altText: true,
            sortOrder: true,
          },
        },
        ...(user ? {
          likes: {
            where: { userId: user.id },
            select: { userId: true },
          },
          saves: {
            where: { userId: user.id },
            select: { userId: true },
          },
        } : {}),
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // For multi-image posts, use first image from media array as thumbnail
    const firstMedia = post.media?.[0];
    const effectiveMediaUrl = post.mediaUrl || firstMedia?.mediaUrl;
    const effectiveThumbnailUrl = post.mediaThumbnailUrl || firstMedia?.thumbnailUrl || firstMedia?.mediaUrl;

    return NextResponse.json({
      post: {
        id: post.id,
        user_id: post.userId,
        content_type: post.contentType,
        headline: post.headline,
        headline_style: post.headlineStyle,
        text_content: post.description,
        media_url: post.mediaUrl,
        media_thumbnail_url: post.mediaThumbnailUrl,
        // Include effective URLs for multi-image post support
        mediaUrl: effectiveMediaUrl,
        mediaThumbnailUrl: effectiveThumbnailUrl,
        media_width: post.mediaWidth,
        media_height: post.mediaHeight,
        media_duration_seconds: post.mediaDurationSeconds,
        provenance: post.provenance,
        visibility: post.visibility,
        status: post.status,
        scheduled_for: post.scheduledFor?.toISOString() || null,
        dropped_at: post.droppedAt?.toISOString() || null,
        hide_teaser: post.hideTeaser,
        likes_count: post._count.likes,
        saves_count: post._count.saves,
        shares_count: post._count.shares,
        views_count: post.viewsCount,
        created_at: post.createdAt.toISOString(),
        author: {
          id: post.user.id,
          username: post.user.username,
          display_name: post.user.displayName,
          avatar_url: post.user.avatarUrl,
          tier: post.user.tier,
        },
        is_liked: user ? (post as any).likes?.length > 0 : false,
        is_saved: user ? (post as any).saves?.length > 0 : false,
        // Include media array for carousel posts
        media: post.media?.map((m) => ({
          id: m.id,
          media_url: m.mediaUrl,
          thumbnail_url: m.thumbnailUrl,
          alt_text: m.altText,
          sort_order: m.sortOrder,
        })) || null,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a post
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

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get hashtags linked to this post so we can decrement their counts
    const postHashtags = await prisma.postHashtag.findMany({
      where: { postId: id },
      select: { hashtagId: true },
    });

    // Delete post (cascades to likes, saves, shares, hashtags)
    await prisma.post.delete({ where: { id } });

    // Decrement hashtag counts
    if (postHashtags.length > 0) {
      await prisma.hashtag.updateMany({
        where: { id: { in: postHashtags.map(ph => ph.hashtagId) } },
        data: { postsCount: { decrement: 1 } },
      });
    }

    // Update user post count
    await prisma.user.update({
      where: { id: user.id },
      data: { postsCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

// PATCH /api/posts/[id] - Update a post
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

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true, contentType: true, status: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { headline, headline_style, text_content, description, visibility, scheduled_for, hide_teaser, cancel_schedule, audience_user_ids, audience_group_ids } = body;

    // Build update data
    const updateData: Record<string, any> = {};

    // Validate and set headline
    if (headline !== undefined) {
      if (headline === null || headline === '') {
        updateData.headline = null;
      } else {
        const trimmedHeadline = headline.trim().replace(/[\r\n]+/g, ' ');
        if (trimmedHeadline.length > 80) {
          return NextResponse.json({ error: 'Headline must be 80 characters or less' }, { status: 400 });
        }
        const urlPattern = /https?:\/\/|www\./i;
        if (urlPattern.test(trimmedHeadline)) {
          return NextResponse.json({ error: 'Headlines cannot contain URLs' }, { status: 400 });
        }
        updateData.headline = trimmedHeadline;
      }
    }

    if (headline_style !== undefined) {
      if (!['normal', 'news'].includes(headline_style)) {
        return NextResponse.json({ error: 'Invalid headline style' }, { status: 400 });
      }
      updateData.headlineStyle = headline_style;
    }

    // Accept both 'description' and 'text_content' for compatibility
    const textContentValue = description !== undefined ? description : text_content;
    if (textContentValue !== undefined) {
      updateData.description = textContentValue?.trim() || null;
    }

    if (visibility !== undefined) {
      if (!['public', 'followers', 'private'].includes(visibility)) {
        return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
      }
      updateData.visibility = visibility;
    }

    // Handle audience updates for private visibility
    const audienceUserIds: string[] = audience_user_ids || [];
    const audienceGroupIds: string[] = audience_group_ids || [];

    if (visibility === 'private' && audienceUserIds.length === 0 && audienceGroupIds.length === 0) {
      return NextResponse.json(
        { error: 'Private posts require at least one follower or group to be selected' },
        { status: 400 }
      );
    }

    // Handle scheduling updates (only for scheduled posts)
    if (cancel_schedule && post.status === 'scheduled') {
      // Cancel the scheduled drop - publish immediately
      updateData.status = 'published';
      updateData.scheduledFor = null;
      updateData.droppedAt = new Date();
    } else if (scheduled_for !== undefined && post.status === 'scheduled') {
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

    // Update audience if visibility is private
    if (visibility === 'private') {
      // Clear existing audience
      await prisma.postAudienceUser.deleteMany({ where: { postId: id } });
      await prisma.postAudienceGroup.deleteMany({ where: { postId: id } });

      // Add new audience users
      if (audienceUserIds.length > 0) {
        await prisma.postAudienceUser.createMany({
          data: audienceUserIds.map((userId: string) => ({
            postId: id,
            userId,
          })),
        });
      }

      // Add new audience groups
      if (audienceGroupIds.length > 0) {
        await prisma.postAudienceGroup.createMany({
          data: audienceGroupIds.map((groupId: string) => ({
            postId: id,
            groupId,
          })),
        });
      }
    } else if (visibility !== undefined) {
      // If changing to public or followers, clear private audience
      await prisma.postAudienceUser.deleteMany({ where: { postId: id } });
      await prisma.postAudienceGroup.deleteMany({ where: { postId: id } });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            likes: true,
            saves: true,
            shares: true,
          },
        },
      },
    });

    return NextResponse.json({
      post: {
        id: updatedPost.id,
        content_type: updatedPost.contentType,
        headline: updatedPost.headline,
        headline_style: updatedPost.headlineStyle,
        text_content: updatedPost.description,
        description: updatedPost.description, // Also include as 'description' for compatibility
        media_url: updatedPost.mediaUrl,
        thumbnail_url: updatedPost.mediaThumbnailUrl,
        visibility: updatedPost.visibility,
        provenance: updatedPost.provenance,
        status: updatedPost.status,
        scheduled_for: updatedPost.scheduledFor?.toISOString() || null,
        dropped_at: updatedPost.droppedAt?.toISOString() || null,
        hide_teaser: updatedPost.hideTeaser,
        created_at: updatedPost.createdAt.toISOString(),
        updated_at: updatedPost.updatedAt.toISOString(),
        author: {
          id: updatedPost.user.id,
          username: updatedPost.user.username,
          display_name: updatedPost.user.displayName,
          avatar_url: updatedPost.user.avatarUrl,
          tier: updatedPost.user.tier,
        },
        stats: {
          likes: updatedPost._count.likes,
          saves: updatedPost._count.saves,
          shares: updatedPost._count.shares,
        },
      },
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
