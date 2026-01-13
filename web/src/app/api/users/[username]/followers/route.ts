import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/[username]/followers - List a user's followers
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
        hideFollowersList: true,
        isPrivate: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwnProfile = currentUser?.id === targetUser.id;

    // Check if followers list is hidden (unless viewing own profile)
    if (!isOwnProfile && targetUser.hideFollowersList) {
      return NextResponse.json({ followers: [], hidden: true });
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
        return NextResponse.json({ followers: [], private: true });
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
            { follower: { username: { contains: search, mode: 'insensitive' as const } } },
            { follower: { displayName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const followers = await prisma.follow.findMany({
      where: {
        followingId: targetUser.id,
        ...searchFilter,
      },
      take: limit + 1,
      cursor: cursor
        ? { followerId_followingId: { followerId: cursor, followingId: targetUser.id } }
        : undefined,
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
    console.error('Get user followers error:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}
