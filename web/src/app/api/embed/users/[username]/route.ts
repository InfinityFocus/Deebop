import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { EmbedContentType, EmbedFeedResponse, EmbedPost, EmbedUser } from '@/types/embed';
import type { ContentType } from '@prisma/client';

// GET /api/embed/users/[username] - Get public user profile + posts for embedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 50);
    const contentType = searchParams.get('type') as EmbedContentType | null;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        tier: true,
        isPrivate: true,
        isDeactivated: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Don't allow embedding private or deactivated profiles
    if (user.isPrivate || user.isDeactivated) {
      return NextResponse.json(
        { error: 'This profile is not available for embedding' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Build content type filter
    const contentTypeFilter = contentType && contentType !== 'all'
      ? { contentType: contentType as ContentType }
      : {};

    // Fetch only public, published posts
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        visibility: 'public',
        status: 'published',
        ...contentTypeFilter,
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
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        media: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            thumbnailUrl: true,
            sortOrder: true,
          },
        },
      },
    });

    // Handle pagination
    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    // Get repost counts
    const postIds = posts.map(p => p.id);
    const repostCounts = await prisma.repost.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds },
        status: 'approved',
      },
      _count: true,
    });
    const repostCountMap = new Map(repostCounts.map(r => [r.postId, r._count]));

    // Format response
    const embedUser: EmbedUser = {
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      tier: user.tier as 'free' | 'creator' | 'pro' | 'teams',
      is_private: false,
    };

    const embedPosts: EmbedPost[] = posts.map((post) => ({
      id: post.id,
      content_type: post.contentType as EmbedPost['content_type'],
      headline: post.headline,
      headline_style: post.headlineStyle as 'normal' | 'news',
      text_content: post.description,
      media_url: post.mediaUrl,
      media_thumbnail_url: post.mediaThumbnailUrl,
      media_duration_seconds: post.mediaDurationSeconds,
      media_waveform_url: null, // Not included in embed view
      provenance: post.provenance,
      likes_count: post._count.likes,
      reposts_count: repostCountMap.get(post.id) || 0,
      created_at: post.createdAt.toISOString(),
      author: {
        username: post.user.username,
        display_name: post.user.displayName,
        avatar_url: post.user.avatarUrl,
      },
      media: post.media.length > 0 ? post.media.map(m => ({
        id: m.id,
        media_url: m.mediaUrl,
        thumbnail_url: m.thumbnailUrl,
        sort_order: m.sortOrder,
      })) : null,
    }));

    const response: EmbedFeedResponse = {
      user: embedUser,
      posts: embedPosts,
      nextCursor,
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (error) {
    console.error('Embed users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user feed' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
