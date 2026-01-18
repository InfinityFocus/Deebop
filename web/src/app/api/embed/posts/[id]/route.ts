import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { EmbedPost, EmbedPostResponse, EmbedUser } from '@/types/embed';

// GET /api/embed/posts/[id] - Get a single public post for embedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the post with author info
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
            isPrivate: true,
            isDeactivated: true,
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Only allow embedding public, published posts from non-private, active users
    if (
      post.visibility !== 'public' ||
      post.status !== 'published' ||
      post.user.isPrivate ||
      post.user.isDeactivated
    ) {
      return NextResponse.json(
        { error: 'This post is not available for embedding' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get repost count
    const repostCount = await prisma.repost.count({
      where: {
        postId: post.id,
        status: 'approved',
      },
    });

    // Format response
    const embedPost: EmbedPost = {
      id: post.id,
      content_type: post.contentType as EmbedPost['content_type'],
      headline: post.headline,
      headline_style: post.headlineStyle as 'normal' | 'news',
      text_content: post.description,
      media_url: post.mediaUrl,
      media_thumbnail_url: post.mediaThumbnailUrl,
      media_duration_seconds: post.mediaDurationSeconds,
      media_waveform_url: null,
      provenance: post.provenance,
      likes_count: post._count.likes,
      reposts_count: repostCount,
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
    };

    const embedAuthor: EmbedUser = {
      id: post.user.id,
      username: post.user.username,
      display_name: post.user.displayName,
      avatar_url: post.user.avatarUrl,
      tier: post.user.tier as 'free' | 'creator' | 'pro' | 'teams',
      is_private: false,
    };

    const response: EmbedPostResponse = {
      post: embedPost,
      author: embedAuthor,
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (error) {
    console.error('Embed posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
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
