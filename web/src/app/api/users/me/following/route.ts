import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/following - List users the current user is following
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
            { following: { username: { contains: search, mode: 'insensitive' as const } } },
            { following: { displayName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const following = await prisma.follow.findMany({
      where: {
        followerId: user.id,
        ...searchFilter,
      },
      take: limit + 1,
      cursor: cursor ? { followerId_followingId: { followerId: user.id, followingId: cursor } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
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
    if (following.length > limit) {
      const nextItem = following.pop();
      nextCursor = nextItem?.followingId;
    }

    return NextResponse.json({
      following: following.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        display_name: f.following.displayName,
        avatar_url: f.following.avatarUrl,
        followed_at: f.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }
}
