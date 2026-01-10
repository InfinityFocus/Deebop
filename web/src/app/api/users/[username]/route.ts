import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/[username] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const currentUser = await getCurrentUser();

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profileLink: true,
        tier: true,
        isPrivate: true,
        followersCount: true,
        followingCount: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: { status: 'published' },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following this user
    let isFollowing = false;
    let isFollowRequested = false;
    let isFavourited = false;

    if (currentUser && currentUser.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;

      if (!isFollowing && user.isPrivate) {
        const request = await prisma.followRequest.findUnique({
          where: {
            requesterId_targetId: {
              requesterId: currentUser.id,
              targetId: user.id,
            },
          },
        });
        isFollowRequested = !!request;
      }

      // Check if current user has favourited this user
      const favourite = await prisma.favourite.findUnique({
        where: {
          userId_favouriteId: {
            userId: currentUser.id,
            favouriteId: user.id,
          },
        },
      });
      isFavourited = !!favourite;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
        profile_link: user.profileLink,
        tier: user.tier,
        is_private: user.isPrivate,
        followers_count: user.followersCount,
        following_count: user.followingCount,
        posts_count: user._count.posts,
        created_at: user.createdAt.toISOString(),
        is_following: isFollowing,
        is_follow_requested: isFollowRequested,
        is_favourited: isFavourited,
        is_own_profile: currentUser?.id === user.id,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
