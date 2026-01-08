import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/drops/upcoming - Get upcoming drops from followed creators
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get IDs of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Also include the user's own scheduled drops
    const userIds = [...followingIds, user.id];

    // Build visibility filter for scheduled content
    // Public: visible to all followers
    // Followers-only: visible to followers
    // Private: visible only to audience members
    const visibilityFilter = {
      OR: [
        // Public scheduled drops
        { visibility: 'public' as const },
        // User's own drops
        { userId: user.id },
        // Followers-only drops (user is following the creator)
        {
          AND: [
            { visibility: 'followers' as const },
            { userId: { in: followingIds } },
          ],
        },
        // Private drops where user is in the audience
        {
          AND: [
            { visibility: 'private' as const },
            { audienceUsers: { some: { userId: user.id } } },
          ],
        },
        {
          AND: [
            { visibility: 'private' as const },
            {
              audienceGroups: {
                some: { group: { members: { some: { userId: user.id } } } },
              },
            },
          ],
        },
      ],
    };

    // Get upcoming scheduled posts
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: { gt: new Date() }, // Only future drops
        userId: { in: userIds },
        ...visibilityFilter,
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' }, // Soonest first
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
          },
        },
      },
    });

    // Get upcoming scheduled albums
    const scheduledAlbums = await prisma.album.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: { gt: new Date() },
        ownerId: { in: userIds },
        OR: [
          { visibility: 'public' as const },
          { ownerId: user.id },
          {
            AND: [
              { visibility: 'followers' as const },
              { ownerId: { in: followingIds } },
            ],
          },
          {
            AND: [
              { visibility: 'private' as const },
              { audienceUsers: { some: { userId: user.id } } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        items: {
          take: 1,
          orderBy: { sortOrder: 'asc' },
          select: {
            thumbnailUrl: true,
            mediaUrl: true,
          },
        },
      },
    });

    // Format posts as drops
    const postDrops = scheduledPosts.map((post) => {
      // For videos/panoramas, only use thumbnail (videos are .mp4, panoramas are huge)
      // For images, use thumbnail or media URL
      let previewUrl: string | null = null;
      if (!post.hideTeaser) {
        if (post.contentType === 'video' || post.contentType === 'panorama360') {
          previewUrl = post.mediaThumbnailUrl; // Only thumbnail for videos/panoramas
        } else {
          previewUrl = post.mediaThumbnailUrl || post.mediaUrl;
        }
      }

      return {
      id: post.id,
      type: 'post' as const,
      content_type: post.contentType,
      title: post.headline,
      headline_style: post.headlineStyle,
      description: post.description,
      preview_url: previewUrl,
      hide_teaser: post.hideTeaser,
      visibility: post.visibility,
      scheduled_for: post.scheduledFor!.toISOString(),
      created_at: post.createdAt.toISOString(),
      creator: {
        id: post.user.id,
        username: post.user.username,
        display_name: post.user.displayName,
        avatar_url: post.user.avatarUrl,
        tier: post.user.tier,
      },
      is_own: post.userId === user.id,
    };
    });

    // Format albums as drops
    const albumDrops = scheduledAlbums.map((album) => ({
      id: album.id,
      type: 'album' as const,
      content_type: 'album',
      title: album.title,
      headline_style: 'normal',
      description: album.description,
      preview_url: album.hideTeaser ? null : (album.coverImageUrl || album.items[0]?.thumbnailUrl || album.items[0]?.mediaUrl || null),
      hide_teaser: album.hideTeaser,
      visibility: album.visibility,
      scheduled_for: album.scheduledFor!.toISOString(),
      created_at: album.createdAt.toISOString(),
      creator: {
        id: album.owner.id,
        username: album.owner.username,
        display_name: album.owner.displayName,
        avatar_url: album.owner.avatarUrl,
      },
      is_own: album.ownerId === user.id,
    }));

    // Combine and sort by scheduled time
    const drops = [...postDrops, ...albumDrops]
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
      .slice(0, limit);

    return NextResponse.json({ drops });
  } catch (error) {
    console.error('Get upcoming drops error:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming drops' }, { status: 500 });
  }
}
