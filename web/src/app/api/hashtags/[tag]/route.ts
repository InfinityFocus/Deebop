import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/hashtags/[tag] - Get posts with this hashtag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await getCurrentUser();

    // Find the hashtag
    const hashtag = await prisma.hashtag.findUnique({
      where: { name: tag.toLowerCase() },
    });

    if (!hashtag) {
      return NextResponse.json({
        hashtag: { name: tag, posts_count: 0 },
        posts: [],
        nextCursor: undefined,
      });
    }

    // Get posts with this hashtag - query posts directly
    const posts = await prisma.post.findMany({
      where: {
        visibility: 'public',
        hashtags: {
          some: { hashtagId: hashtag.id },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
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
        likes: user ? {
          where: { userId: user.id },
          select: { userId: true },
        } : false,
        saves: user ? {
          where: { userId: user.id },
          select: { userId: true },
        } : false,
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    // Transform posts for response
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      user_id: post.userId,
      content_type: post.contentType,
      text_content: post.textContent,
      media_url: post.mediaUrl,
      media_thumbnail_url: post.mediaThumbnailUrl,
      media_width: post.mediaWidth,
      media_height: post.mediaHeight,
      media_duration_seconds: post.mediaDurationSeconds,
      provenance: post.provenance,
      visibility: post.visibility,
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
      is_liked: user && post.likes ? post.likes.length > 0 : false,
      is_saved: user && post.saves ? post.saves.length > 0 : false,
    }));

    return NextResponse.json({
      hashtag: {
        id: hashtag.id,
        name: hashtag.name,
        posts_count: hashtag.postsCount,
      },
      posts: transformedPosts,
      nextCursor,
    });
  } catch (error) {
    console.error('Get hashtag posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch hashtag posts' }, { status: 500 });
  }
}
