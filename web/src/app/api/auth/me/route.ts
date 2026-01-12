import { NextResponse } from 'next/server';
import { getCurrentUser, getIdentity, getIdentityProfiles, PROFILE_LIMITS } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Get identity for tier/billing info
    const identity = await getIdentity();

    // Get all profiles for profile switcher
    const profiles = await getIdentityProfiles();

    // Get actual post count from database
    const postCount = await prisma.post.count({
      where: {
        userId: user.id,
        status: 'published',
      },
    });

    // Calculate profile limit based on identity tier
    const tier = identity?.tier || user.tier;
    const profileLimit = PROFILE_LIMITS[tier as keyof typeof PROFILE_LIMITS] || 1;

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
        tier: tier,
        is_private: user.isPrivate,
        followers_count: user.followersCount,
        following_count: user.followingCount,
        posts_count: postCount,
        // Multi-profile fields
        identity_id: user.identityId,
        is_default: user.isDefault,
      },
      // Multi-profile support
      identity: identity ? {
        id: identity.id,
        email: identity.email,
        tier: identity.tier,
        is_banned: identity.isBanned,
      } : null,
      profiles: profiles.map(p => ({
        id: p.id,
        username: p.username,
        display_name: p.displayName,
        avatar_url: p.avatarUrl,
        is_default: p.isDefault,
        is_suspended: p.isSuspended,
      })),
      profile_limit: profileLimit,
      can_add_profile: profiles.length < profileLimit,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null });
  }
}
