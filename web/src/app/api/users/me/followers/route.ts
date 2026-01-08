import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/followers - List users who follow the current user (for audience selection)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { follower: { username: { contains: search, mode: 'insensitive' as const } } },
            { follower: { displayName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const followers = await prisma.follow.findMany({
      where: {
        followingId: user.id,
        ...searchFilter,
      },
      take: limit + 1,
      cursor: cursor ? { followerId_followingId: { followerId: cursor, followingId: user.id } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    let nextCursor: string | undefined;
    if (followers.length > limit) {
      const nextItem = followers.pop();
      nextCursor = nextItem?.followerId;
    }

    return NextResponse.json({
      followers: followers.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        display_name: f.follower.displayName,
        avatar_url: f.follower.avatarUrl,
        followed_at: f.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}
