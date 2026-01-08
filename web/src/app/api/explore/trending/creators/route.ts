import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/explore/trending/creators - Get trending creators (7d window)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const interestSlug = searchParams.get('interest');

    // 7 day window for follow growth
    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Build interest filter
    let interestUserIds: string[] | null = null;
    if (interestSlug) {
      const interest = await prisma.interest.findUnique({
        where: { slug: interestSlug },
        select: { id: true },
      });

      if (interest) {
        const usersWithInterest = await prisma.userInterest.findMany({
          where: { interestId: interest.id },
          select: { userId: true },
        });
        interestUserIds = usersWithInterest.map((ui) => ui.userId);
      }
    }

    // Get users with their recent follower counts
    const users = await prisma.user.findMany({
      where: interestUserIds
        ? { id: { in: interestUserIds } }
        : undefined,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        followersCount: true,
        postsCount: true,
        followers: {
          where: {
            createdAt: { gte: windowStart },
          },
          select: { followerId: true },
        },
        posts: {
          where: {
            createdAt: { gte: windowStart },
            visibility: 'public',
          },
          select: {
            likesCount: true,
          },
        },
      },
    });

    // Calculate trending score for each creator
    const scoredCreators = users.map((user) => {
      const recentFollowerCount = user.followers.length;
      const totalFollowers = user.followersCount;
      const recentPosts = user.posts.length;
      const avgLikesPerPost =
        recentPosts > 0
          ? user.posts.reduce((sum: number, p: { likesCount: number }) => sum + p.likesCount, 0) / recentPosts
          : 0;

      // Trending formula: followerGrowth * 10 + avgLikesPerPost * 5
      const trendingScore =
        recentFollowerCount * 10 + avgLikesPerPost * 5 + recentPosts * 2;

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatarUrl,
        bio: user.bio,
        followerCount: totalFollowers,
        recentFollowerGain: recentFollowerCount,
        postCount: user.postsCount,
        trendingScore,
      };
    });

    // Sort by trending score and filter out those with no activity
    const trendingCreators = scoredCreators
      .filter((c) => c.trendingScore > 0)
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(offset, offset + limit);

    return NextResponse.json({
      creators: trendingCreators,
      window: '7d',
    });
  } catch (error) {
    console.error('Error fetching trending creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending creators' },
      { status: 500 }
    );
  }
}
