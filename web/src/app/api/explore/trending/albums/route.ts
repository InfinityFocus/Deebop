import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/explore/trending/albums - Get trending albums (7d window)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 7 day window
    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get public albums with engagement metrics
    const albums = await prisma.album.findMany({
      where: {
        status: 'published',
        visibility: 'public',
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        createdAt: true,
        itemsCount: true,
        membersCount: true,
        likesCount: true,
        savesCount: true,
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        // Get first item for fallback cover image
        items: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            mediaUrl: true,
            thumbnailUrl: true,
          },
        },
        // Get recent saves
        saves: {
          where: {
            createdAt: { gte: windowStart },
          },
          select: { userId: true },
        },
        // Get recent likes
        likes: {
          where: {
            createdAt: { gte: windowStart },
          },
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate trending score for each album
    const scoredAlbums = albums.map((album) => {
      const recentSaves = album.saves.length;
      const recentLikes = album.likes.length;
      const memberCount = album.membersCount;
      const itemCount = album.itemsCount;

      // Trending formula: saves + likes * 0.5 + membersCount
      const trendingScore =
        recentSaves * 2 + recentLikes + memberCount + Math.min(itemCount, 10) * 0.5;

      // Use first item as fallback cover if no cover image is set
      const firstItem = album.items?.[0];
      const coverUrl = album.coverImageUrl || firstItem?.thumbnailUrl || firstItem?.mediaUrl;

      return {
        id: album.id,
        name: album.title,
        description: album.description,
        coverUrl,
        createdAt: album.createdAt,
        itemCount,
        memberCount,
        creator: {
          id: album.owner.id,
          username: album.owner.username,
          displayName: album.owner.displayName,
          avatar: album.owner.avatarUrl,
        },
        recentSaves,
        recentLikes,
        trendingScore,
      };
    });

    // Sort by trending score
    const trendingAlbums = scoredAlbums
      .filter((a) => a.trendingScore > 0 || a.itemCount > 0)
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(offset, offset + limit);

    return NextResponse.json({
      albums: trendingAlbums,
      window: '7d',
    });
  } catch (error) {
    console.error('Error fetching trending albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending albums' },
      { status: 500 }
    );
  }
}
