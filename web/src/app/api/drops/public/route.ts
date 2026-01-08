import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/drops/public - Get all public upcoming drops (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get upcoming scheduled posts with public visibility
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'scheduled',
        visibility: 'public',
        scheduledFor: { gt: new Date() },
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' },
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

    // Get upcoming scheduled albums with public visibility
    const scheduledAlbums = await prisma.album.findMany({
      where: {
        status: 'scheduled',
        visibility: 'public',
        scheduledFor: { gt: new Date() },
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' },
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
          take: 1,
          orderBy: { sortOrder: 'asc' },
          select: {
            thumbnailUrl: true,
            mediaUrl: true,
          },
        },
      },
    });

    // Format posts as drops
    const postDrops = scheduledPosts.map((post) => {
      let previewUrl: string | null = null;
      if (!post.hideTeaser) {
        if (post.contentType === 'video' || post.contentType === 'panorama360') {
          previewUrl = post.mediaThumbnailUrl;
        } else {
          previewUrl = post.mediaThumbnailUrl || post.mediaUrl;
        }
      }

      return {
        id: post.id,
        type: 'post' as const,
        content_type: post.contentType,
        title: post.headline,
        headline_style: post.headlineStyle,
        description: post.description,
        preview_url: previewUrl,
        hide_teaser: post.hideTeaser,
        visibility: post.visibility,
        scheduled_for: post.scheduledFor!.toISOString(),
        created_at: post.createdAt.toISOString(),
        creator: {
          id: post.user.id,
          username: post.user.username,
          display_name: post.user.displayName,
          avatar_url: post.user.avatarUrl,
          tier: post.user.tier,
        },
        is_own: false,
      };
    });

    // Format albums as drops
    const albumDrops = scheduledAlbums.map((album) => ({
      id: album.id,
      type: 'album' as const,
      content_type: 'album',
      title: album.title,
      headline_style: 'normal',
      description: album.description,
      preview_url: album.hideTeaser
        ? null
        : album.coverImageUrl || album.items[0]?.thumbnailUrl || album.items[0]?.mediaUrl || null,
      hide_teaser: album.hideTeaser,
      visibility: album.visibility,
      scheduled_for: album.scheduledFor!.toISOString(),
      created_at: album.createdAt.toISOString(),
      creator: {
        id: album.owner.id,
        username: album.owner.username,
        display_name: album.owner.displayName,
        avatar_url: album.owner.avatarUrl,
      },
      is_own: false,
    }));

    // Combine and sort by scheduled time
    const drops = [...postDrops, ...albumDrops]
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
      .slice(0, limit);

    return NextResponse.json({ drops });
  } catch (error) {
    console.error('Get public drops error:', error);
    return NextResponse.json({ error: 'Failed to fetch public drops' }, { status: 500 });
  }
}
