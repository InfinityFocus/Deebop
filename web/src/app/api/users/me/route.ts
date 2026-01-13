import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me - Get current user's profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profileLink: true,
        tier: true,
        isPrivate: true,
        showActivityStatus: true,
        allowTagging: true,
        requireTaggingApproval: true,
        showLikedPosts: true,
        allowReposts: true,
        requireRepostApproval: true,
        followersCount: true,
        followingCount: true,
        _count: {
          select: {
            posts: {
              where: { status: 'published' },
            },
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: fullUser.id,
        username: fullUser.username,
        display_name: fullUser.displayName,
        bio: fullUser.bio,
        avatar_url: fullUser.avatarUrl,
        profile_link: fullUser.profileLink,
        tier: fullUser.tier,
        is_private: fullUser.isPrivate,
        show_activity_status: fullUser.showActivityStatus,
        allow_tagging: fullUser.allowTagging,
        require_tagging_approval: fullUser.requireTaggingApproval,
        show_liked_posts: fullUser.showLikedPosts,
        allow_reposts: fullUser.allowReposts,
        require_repost_approval: fullUser.requireRepostApproval,
        followers_count: fullUser.followersCount,
        following_count: fullUser.followingCount,
        posts_count: fullUser._count.posts,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// PATCH /api/users/me - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      display_name,
      bio,
      profile_link,
      is_private,
      show_activity_status,
      allow_tagging,
      require_tagging_approval,
      show_liked_posts,
      allow_reposts,
      require_repost_approval,
    } = body;

    // Validate profile link if provided
    if (profile_link && user.tier === 'free') {
      return NextResponse.json(
        { error: 'Profile links require Standard or Pro tier' },
        { status: 403 }
      );
    }

    // Validate profile link format
    if (profile_link) {
      try {
        new URL(profile_link);
      } catch {
        return NextResponse.json(
          { error: 'Invalid profile link URL' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      displayName?: string | null;
      bio?: string | null;
      profileLink?: string | null;
      isPrivate?: boolean;
      showActivityStatus?: boolean;
      allowTagging?: boolean;
      requireTaggingApproval?: boolean;
      showLikedPosts?: boolean;
      allowReposts?: boolean;
      requireRepostApproval?: boolean;
    } = {};

    if (display_name !== undefined) {
      updateData.displayName = display_name?.trim() || null;
    }
    if (bio !== undefined) {
      updateData.bio = bio?.trim() || null;
    }
    if (profile_link !== undefined) {
      updateData.profileLink = profile_link?.trim() || null;
    }
    if (typeof is_private === 'boolean') {
      updateData.isPrivate = is_private;
    }
    if (typeof show_activity_status === 'boolean') {
      updateData.showActivityStatus = show_activity_status;
    }
    if (typeof allow_tagging === 'boolean') {
      updateData.allowTagging = allow_tagging;
    }
    if (typeof require_tagging_approval === 'boolean') {
      updateData.requireTaggingApproval = require_tagging_approval;
    }
    if (typeof show_liked_posts === 'boolean') {
      updateData.showLikedPosts = show_liked_posts;
    }
    if (typeof allow_reposts === 'boolean') {
      updateData.allowReposts = allow_reposts;
    }
    if (typeof require_repost_approval === 'boolean') {
      updateData.requireRepostApproval = require_repost_approval;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profileLink: true,
        tier: true,
        isPrivate: true,
        showActivityStatus: true,
        allowTagging: true,
        requireTaggingApproval: true,
        showLikedPosts: true,
        allowReposts: true,
        requireRepostApproval: true,
        followersCount: true,
        followingCount: true,
        _count: {
          select: {
            posts: {
              where: { status: 'published' },
            },
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        display_name: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatarUrl,
        profile_link: updatedUser.profileLink,
        tier: updatedUser.tier,
        is_private: updatedUser.isPrivate,
        show_activity_status: updatedUser.showActivityStatus,
        allow_tagging: updatedUser.allowTagging,
        require_tagging_approval: updatedUser.requireTaggingApproval,
        show_liked_posts: updatedUser.showLikedPosts,
        allow_reposts: updatedUser.allowReposts,
        require_repost_approval: updatedUser.requireRepostApproval,
        followers_count: updatedUser.followersCount,
        following_count: updatedUser.followingCount,
        posts_count: updatedUser._count.posts,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
