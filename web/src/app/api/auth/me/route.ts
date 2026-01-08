import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Get actual post count from database
    const postCount = await prisma.post.count({
      where: {
        userId: user.id,
        status: 'published',
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.displayName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
        cover_image_url: user.coverImageUrl,
        profile_link: user.profileLink,
        tier: user.tier,
        is_private: user.isPrivate,
        followers_count: user.followersCount,
        following_count: user.followingCount,
        posts_count: postCount,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null });
  }
}
