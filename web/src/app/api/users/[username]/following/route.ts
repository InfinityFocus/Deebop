import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/[username]/following - List users that a user is following
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const currentUser = await getCurrentUser();

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        hideFollowingList: true,
        isPrivate: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwnProfile = currentUser?.id === targetUser.id;

    // Check if following list is hidden (unless viewing own profile)
    if (!isOwnProfile && targetUser.hideFollowingList) {
      return NextResponse.json({ following: [], hidden: true });
    }

    // For private accounts, only show to followers or self
    if (!isOwnProfile && targetUser.isPrivate && currentUser) {
      const isFollowing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        },
      });

      if (!isFollowing) {
        return NextResponse.json({ following: [], private: true });
      }
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
        followerId: targetUser.id,
        ...searchFilter,
      },
      take: limit + 1,
      cursor: cursor
        ? { followerId_followingId: { followerId: targetUser.id, followingId: cursor } }
        : undefined,
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
    console.error('Get user following error:', error);
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }
}
