import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { uploadToMinio, generateFileKey } from '@/lib/minio';
import { calculateTrendingScore, applyDiversityPass, applyFollowedPenalty } from '@/lib/feed-scoring';
import { matchPostToInterests } from '@/lib/post-interest-matcher';

type FeedMode = 'discovery' | 'following';

// Auto-publish overdue scheduled posts (fallback for when cron doesn't run)
async function publishOverdueDrops() {
  const now = new Date();
  const result = await prisma.post.updateMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now }
    },
    data: {
      status: 'published',
      droppedAt: now
    }
  });
  if (result.count > 0) {
    console.log(`[Auto-publish] Published ${result.count} overdue drops`);
  }
}


// GET /api/posts - Fetch posts feed with visibility filtering and feed modes
export async function GET(request: NextRequest) {
  try {
    // Auto-publish any overdue scheduled drops
    await publishOverdueDrops();

    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const contentType = searchParams.get('type'); // 'shout', 'image', 'video', 'audio', 'panorama360'
    const userId = searchParams.get('userId'); // For profile feeds
    const mode = (searchParams.get('mode') as FeedMode) || 'discovery'; // 'discovery' or 'following'
    const savedOnly = searchParams.get('saved') === 'true'; // For saved posts page

    // Calculate if user is under 16 (for sensitive content filtering)
    // Users without birthYear (existing/test users) see all content
    const currentYear = new Date().getFullYear();
    const userAge = user?.birthYear ? currentYear - user.birthYear : null;
    const isUnder16 = userAge !== null && userAge < 16;

    // Build content type filter
    const contentTypeFilter = contentType
      ? { contentType: contentType as 'shout' | 'image' | 'video' | 'audio' | 'panorama360' }
      : {};

    // Build sensitive content filter (hide sensitive posts from users under 16)
    const sensitiveContentFilter = isUnder16 ? { isSensitiveContent: false } : {};

    // Build user filter (for profile pages)
    const userFilter = userId ? { userId } : {};

    // Get list of users the current user follows (needed for both modes)
    let followingIds: string[] = [];
    if (user) {
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });
      followingIds = following.map((f) => f.followingId);
    }

    // Get repost settings for chain reposting behavior
    const repostSettings = await prisma.repostSettings.findFirst();
    const allowChainReposts = repostSettings?.allowChainReposts ?? true;

    // If saved posts requested
    if (savedOnly) {
      return await fetchSavedFeed(user, contentTypeFilter, sensitiveContentFilter, cursor, limit);
    }

    // If profile page (userId specified), use legacy behavior (no mode filtering)
    if (userId) {
      return await fetchProfileFeed(user, userId, contentTypeFilter, sensitiveContentFilter, cursor, limit, followingIds);
    }

    // Handle feed modes
    if (mode === 'following') {
      return await fetchFollowingFeed(user, contentTypeFilter, sensitiveContentFilter, cursor, limit, followingIds, allowChainReposts);
    } else {
      return await fetchDiscoveryFeed(user, contentTypeFilter, sensitiveContentFilter, cursor, limit, followingIds, allowChainReposts);
    }
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// Saved Feed: Posts the user has saved
async function fetchSavedFeed(
  user: { id: string } | null,
  contentTypeFilter: { contentType?: string },
  sensitiveContentFilter: { isSensitiveContent?: boolean },
  cursor: string | null,
  limit: number
) {
  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to view saved posts' }, { status: 401 });
  }

  // Get IDs of posts the user has saved
  const savedPosts = await prisma.save.findMany({
    where: { userId: user.id },
    select: { postId: true },
    orderBy: { createdAt: 'desc' },
  });

  const savedPostIds = savedPosts.map(s => s.postId);

  if (savedPostIds.length === 0) {
    return NextResponse.json({
      posts: [],
      nextCursor: undefined,
    });
  }

  const posts = await prisma.post.findMany({
    where: {
      id: { in: savedPostIds },
      ...contentTypeFilter,
      ...sensitiveContentFilter,
      status: 'published',
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          isPrivate: true,
          allowReposts: true,
        },
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          shares: true,
        },
      },
      likes: { where: { userId: user.id }, select: { userId: true } },
      saves: { where: { userId: user.id }, select: { userId: true } },
      reposts: { where: { userId: user.id }, select: { status: true } },
    },
  });

  let nextCursor: string | undefined;
  if (posts.length > limit) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
  }

  const formattedPosts = posts.map((post) => {
    const userRepost = post.reposts?.[0];
    return formatPost(post, user, false, {
      reposted: !!userRepost,
      status: userRepost?.status || null,
    });
  });

  return NextResponse.json({
    posts: formattedPosts,
    nextCursor,
  });
}

// Following Feed: Posts from followed accounts only, chronological with diversity
async function fetchFollowingFeed(
  user: { id: string } | null,
  contentTypeFilter: { contentType?: string },
  sensitiveContentFilter: { isSensitiveContent?: boolean },
  cursor: string | null,
  limit: number,
  followingIds: string[],
  allowChainReposts: boolean = true
) {
  if (!user) {
    return NextResponse.json({ error: 'Must be logged in for Following feed' }, { status: 401 });
  }

  if (followingIds.length === 0) {
    return NextResponse.json({
      posts: [],
      nextCursor: undefined,
      empty_reason: 'no_follows',
    });
  }

  // Build visibility filter for following feed
  const visibilityFilter = {
    OR: [
      { visibility: 'public' as const },
      // Followers-only posts from followed users
      { visibility: 'followers' as const },
      // Private posts where user is in audience
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

  // Fetch more posts than needed for diversity pass
  const fetchLimit = Math.min(limit * 2, 100);

  // Fetch posts from followed users
  const posts = await prisma.post.findMany({
    where: {
      ...contentTypeFilter,
      ...sensitiveContentFilter,
      ...visibilityFilter,
      userId: { in: followingIds }, // Only from followed users
      status: 'published',
    },
    take: fetchLimit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          isPrivate: true,
          allowReposts: true,
        },
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          shares: true,
        },
      },
      likes: { where: { userId: user.id }, select: { userId: true } },
      saves: { where: { userId: user.id }, select: { userId: true } },
      reposts: { where: { userId: user.id }, select: { status: true } },
    },
  });

  // Fetch approved reposts from followed users
  const reposts = await prisma.repost.findMany({
    where: {
      userId: { in: followingIds },
      status: 'approved',
      // Apply content type filter if specified
      ...(contentTypeFilter.contentType ? { post: { contentType: contentTypeFilter.contentType as 'shout' | 'image' | 'video' | 'audio' | 'panorama360' } } : {}),
      ...(Object.keys(sensitiveContentFilter).length > 0 ? { post: sensitiveContentFilter } : {}),
    },
    take: fetchLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      post: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              tier: true,
              isPrivate: true,
              allowReposts: true,
            },
          },
          _count: {
            select: {
              likes: true,
              saves: true,
              shares: true,
            },
          },
          likes: { where: { userId: user.id }, select: { userId: true } },
          saves: { where: { userId: user.id }, select: { userId: true } },
          reposts: { where: { userId: user.id }, select: { status: true } },
        },
      },
    },
  });

  // Create combined feed items with timestamps for sorting
  type FeedItem = {
    type: 'post' | 'repost';
    timestamp: Date;
    data: any;
  };

  const feedItems: FeedItem[] = [
    ...posts.map((post) => ({
      type: 'post' as const,
      timestamp: post.createdAt,
      data: post,
    })),
    ...reposts
      .filter((r) => r.post.status === 'published')
      .map((repost) => ({
        type: 'repost' as const,
        timestamp: repost.createdAt,
        data: repost,
      })),
  ];

  // Sort by timestamp descending
  feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Deduplicate - if we have both a post and reposts of that post, keep only the post
  const seenPostIds = new Set<string>();
  const deduplicatedItems = feedItems.filter((item) => {
    const postId = item.type === 'post' ? item.data.id : item.data.postId;
    if (seenPostIds.has(postId)) {
      return false;
    }
    seenPostIds.add(postId);
    return true;
  });

  // Take only the limit we need
  const limitedItems = deduplicatedItems.slice(0, limit + 1);

  let nextCursor: string | undefined;
  if (limitedItems.length > limit) {
    limitedItems.pop();
    // For cursor, use the timestamp of the last item
    const lastItem = limitedItems[limitedItems.length - 1];
    nextCursor = lastItem.type === 'post' ? lastItem.data.id : `repost-${lastItem.data.id}`;
  }

  const followingSet = new Set(followingIds);
  const formattedItems = limitedItems.map((item) => {
    if (item.type === 'post') {
      const post = item.data;
      const userRepost = post.reposts?.[0];
      return formatPost(post, user, false, {
        reposted: !!userRepost,
        status: userRepost?.status || null,
      });
    } else {
      const repost = item.data;
      return formatRepost(repost, user, followingSet.has(repost.post.userId), allowChainReposts);
    }
  });

  return NextResponse.json({
    posts: formattedItems,
    nextCursor,
  });
}

// Discovery Feed: All public posts, ranked by trending score
// Also includes reposts from followed users
async function fetchDiscoveryFeed(
  user: { id: string } | null,
  contentTypeFilter: { contentType?: string },
  sensitiveContentFilter: { isSensitiveContent?: boolean },
  cursor: string | null,
  limit: number,
  followingIds: string[],
  allowChainReposts: boolean = true
) {
  // Fetch user's content preferences if logged in
  let contentPrefsFilter: Record<string, unknown> = {};
  if (user) {
    const contentPrefs = await prisma.userContentPrefs.findUnique({
      where: { userId: user.id },
    });

    // Only apply filters if applyToDiscoveryFeed is enabled
    if (contentPrefs?.applyToDiscoveryFeed) {
      // Build provenance filter
      const excludedProvenance: string[] = [];
      if (contentPrefs.hideAiGenerated) excludedProvenance.push('ai_generated');
      if (contentPrefs.hideAiAssisted) excludedProvenance.push('ai_assisted');

      if (excludedProvenance.length > 0) {
        contentPrefsFilter.provenance = { notIn: excludedProvenance };
      }
      if (contentPrefs.hidePaidPartnership) {
        contentPrefsFilter.isSponsoredContent = false;
      }
      if (contentPrefs.hideSensitiveContent) {
        contentPrefsFilter.isSensitiveContent = false;
      }
    }
  }

  // For Discovery, we only show public posts
  const posts = await prisma.post.findMany({
    where: {
      ...contentTypeFilter,
      ...sensitiveContentFilter,
      ...contentPrefsFilter,
      visibility: 'public',
      status: 'published',
    },
    // Fetch more for ranking/sorting
    take: Math.min(limit * 3, 150),
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }, // Initial fetch by recency, then re-rank
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          isPrivate: true,
          allowReposts: true,
        },
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          shares: true,
        },
      },
      likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      saves: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      reposts: user ? { where: { userId: user.id }, select: { status: true } } : false,
    },
  });

  // Create set for quick lookup
  const followingSet = new Set(followingIds);

  // Fetch approved reposts from followed users (if user is logged in and follows anyone)
  let reposts: any[] = [];
  if (user && followingIds.length > 0) {
    reposts = await prisma.repost.findMany({
      where: {
        userId: { in: followingIds },
        status: 'approved',
        post: {
          visibility: 'public',
          status: 'published',
          ...(contentTypeFilter.contentType ? { contentType: contentTypeFilter.contentType as 'shout' | 'image' | 'video' | 'audio' | 'panorama360' } : {}),
          ...(Object.keys(sensitiveContentFilter).length > 0 ? sensitiveContentFilter : {}),
          ...(Object.keys(contentPrefsFilter).length > 0 ? contentPrefsFilter : {}),
        },
      },
      take: Math.min(limit * 2, 100),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                tier: true,
                isPrivate: true,
                allowReposts: true,
              },
            },
            _count: {
              select: {
                likes: true,
                saves: true,
                shares: true,
              },
            },
            likes: { where: { userId: user.id }, select: { userId: true } },
            saves: { where: { userId: user.id }, select: { userId: true } },
            reposts: { where: { userId: user.id }, select: { status: true } },
          },
        },
      },
    });
  }

  // Calculate trending scores and sort posts
  const scoredPosts = posts.map((post) => {
    const isFollowed = followingSet.has(post.userId);
    let score = calculateTrendingScore({
      id: post.id,
      likesCount: post._count.likes,
      savesCount: post._count.saves,
      sharesCount: post._count.shares,
      viewsCount: 0,
      createdAt: post.createdAt,
    });

    // Apply penalty to posts from followed users (30% reduction)
    score = applyFollowedPenalty(score, isFollowed);

    return { ...post, _score: score, _isFollowed: isFollowed };
  });

  // Sort by trending score (highest first)
  scoredPosts.sort((a, b) => b._score - a._score);

  // Create combined feed items - posts + reposts
  type FeedItem = {
    type: 'post' | 'repost';
    timestamp: Date;
    score: number;
    data: any;
    isFollowed: boolean;
  };

  const feedItems: FeedItem[] = [
    ...scoredPosts.map((post) => ({
      type: 'post' as const,
      timestamp: post.createdAt,
      score: post._score,
      data: post,
      isFollowed: post._isFollowed,
    })),
    ...reposts
      .filter((r) => r.post.status === 'published')
      .map((repost) => ({
        type: 'repost' as const,
        timestamp: repost.createdAt,
        // Give reposts a reasonable score based on the original post's engagement
        score: calculateTrendingScore({
          id: repost.post.id,
          likesCount: repost.post._count?.likes || 0,
          savesCount: repost.post._count?.saves || 0,
          sharesCount: repost.post._count?.shares || 0,
          viewsCount: 0,
          createdAt: repost.post.createdAt,
        }),
        data: repost,
        isFollowed: followingSet.has(repost.post.userId),
      })),
  ];

  // Sort by score (trending), with reposts given a slight boost for recency
  feedItems.sort((a, b) => {
    // For reposts, blend score with recency (reposts are time-sensitive social signals)
    const aScore = a.type === 'repost' ? a.score * 1.2 : a.score;
    const bScore = b.type === 'repost' ? b.score * 1.2 : b.score;
    return bScore - aScore;
  });

  // Build a map of postId -> repost for posts that have been reposted by followed users
  // These should be shown as reposts, not as original posts
  const repostedByFollowedMap = new Map<string, FeedItem>();
  for (const item of feedItems) {
    if (item.type === 'repost') {
      const postId = item.data.postId;
      // Prefer the most recent repost if there are multiple
      if (!repostedByFollowedMap.has(postId)) {
        repostedByFollowedMap.set(postId, item);
      }
    }
  }

  // Deduplicate - prefer reposts from followed users over original posts
  const seenPostIds = new Set<string>();
  const deduplicatedItems: FeedItem[] = [];

  for (const item of feedItems) {
    const postId = item.type === 'post' ? item.data.id : item.data.postId;

    if (seenPostIds.has(postId)) {
      continue; // Already seen this post
    }

    // If this is an original post but we have a repost of it from a followed user,
    // skip the original and add the repost instead
    if (item.type === 'post' && repostedByFollowedMap.has(postId)) {
      const repostItem = repostedByFollowedMap.get(postId)!;
      deduplicatedItems.push(repostItem);
      seenPostIds.add(postId);
      continue;
    }

    deduplicatedItems.push(item);
    seenPostIds.add(postId);
  }

  // Take only the limit we need
  const limitedItems = deduplicatedItems.slice(0, limit + 1);

  let nextCursor: string | undefined;
  if (limitedItems.length > limit) {
    const lastItem = limitedItems.pop();
    nextCursor = lastItem?.type === 'post' ? lastItem.data.id : `repost-${lastItem?.data.id}`;
  }

  const formattedItems = limitedItems.map((item) => {
    if (item.type === 'post') {
      const post = item.data;
      const userRepost = Array.isArray(post.reposts) ? post.reposts[0] : null;
      return formatPost(post, user, item.isFollowed, {
        reposted: !!userRepost,
        status: userRepost?.status || null,
      });
    } else {
      const repost = item.data;
      return formatRepost(repost, user, item.isFollowed, allowChainReposts);
    }
  });

  return NextResponse.json({
    posts: formattedItems,
    nextCursor,
  });
}

// Profile Feed: Legacy behavior for profile pages
async function fetchProfileFeed(
  user: { id: string } | null,
  profileUserId: string,
  contentTypeFilter: { contentType?: string },
  sensitiveContentFilter: { isSensitiveContent?: boolean },
  cursor: string | null,
  limit: number,
  followingIds: string[]
) {
  // Build visibility filter based on authentication
  const visibilityFilter = user
    ? {
        OR: [
          { visibility: 'public' as const },
          { userId: user.id },
          {
            AND: [
              { visibility: 'followers' as const },
              { user: { followers: { some: { followerId: user.id } } } },
            ],
          },
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
      }
    : { visibility: 'public' as const };

  const posts = await prisma.post.findMany({
    where: {
      ...contentTypeFilter,
      ...sensitiveContentFilter,
      userId: profileUserId,
      ...visibilityFilter,
      status: 'published',
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          isPrivate: true,
          allowReposts: true,
        },
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          shares: true,
        },
      },
      likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      saves: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      reposts: user ? { where: { userId: user.id }, select: { status: true } } : false,
    },
  });

  let nextCursor: string | undefined;
  if (posts.length > limit) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
  }

  const followingSet = new Set(followingIds);
  const formattedPosts = posts.map((post) => {
    const userRepost = Array.isArray(post.reposts) ? post.reposts[0] : null;
    return formatPost(post, user, followingSet.has(post.userId), {
      reposted: !!userRepost,
      status: userRepost?.status || null,
    });
  });

  return NextResponse.json({
    posts: formattedPosts,
    nextCursor,
  });
}

// Helper to format a post for API response
function formatPost(
  post: any,
  user: { id: string } | null,
  isFollowing: boolean,
  userRepostStatus?: { reposted: boolean; status: string | null }
) {
  return {
    type: 'post' as const,
    id: post.id,
    user_id: post.userId,
    content_type: post.contentType,
    headline: post.headline,
    headline_style: post.headlineStyle,
    text_content: post.description,
    media_url: post.mediaUrl,
    media_thumbnail_url: post.mediaThumbnailUrl,
    media_width: null,
    media_height: null,
    media_duration_seconds: null,
    visibility: post.visibility,
    provenance: post.provenance,
    status: post.status,
    dropped_at: post.droppedAt?.toISOString() || null,
    is_sponsored_content: post.isSponsoredContent,
    is_sensitive_content: post.isSensitiveContent,
    likes_count: post._count.likes,
    saves_count: post._count.saves,
    shares_count: post._count.shares,
    reposts_count: post.repostsCount || 0,
    views_count: 0,
    created_at: post.createdAt.toISOString(),
    author: {
      id: post.user.id,
      username: post.user.username,
      display_name: post.user.displayName,
      avatar_url: post.user.avatarUrl,
      tier: post.user.tier,
      allow_reposts: post.user.allowReposts ?? true,
    },
    is_liked: user ? (Array.isArray(post.likes) && post.likes.length > 0) : false,
    is_saved: user ? (Array.isArray(post.saves) && post.saves.length > 0) : false,
    is_following: isFollowing,
    // Repost fields
    is_reposted: userRepostStatus?.reposted || false,
    repost_status: userRepostStatus?.status || null,
    can_repost: post.visibility === 'public' &&
                !post.user.isPrivate &&
                (post.user.allowReposts ?? true) &&
                user?.id !== post.userId,
  };
}

// Helper to format a repost for API response
function formatRepost(
  repost: any,
  user: { id: string } | null,
  isFollowingAuthor: boolean,
  allowChainReposts: boolean = true
) {
  const post = repost.post;
  // Determine if the user can repost this (chain repost the original)
  const canRepost = allowChainReposts &&
                    post.visibility === 'public' &&
                    !post.user.isPrivate &&
                    (post.user.allowReposts ?? true) &&
                    user?.id !== post.userId;

  return {
    type: 'repost' as const,
    id: `repost-${repost.id}`,
    repost_id: repost.id,
    original_post_id: post.id, // For chain reposting - this is what gets reposted
    reposter: {
      id: repost.user.id,
      username: repost.user.username,
      display_name: repost.user.displayName,
      avatar_url: repost.user.avatarUrl,
    },
    reposted_at: repost.createdAt.toISOString(),
    // Original post data
    post_id: post.id,
    user_id: post.userId,
    content_type: post.contentType,
    headline: post.headline,
    headline_style: post.headlineStyle,
    text_content: post.description,
    media_url: post.mediaUrl,
    media_thumbnail_url: post.mediaThumbnailUrl,
    media_width: null,
    media_height: null,
    media_duration_seconds: null,
    visibility: post.visibility,
    provenance: post.provenance,
    status: post.status,
    dropped_at: post.droppedAt?.toISOString() || null,
    is_sponsored_content: post.isSponsoredContent,
    is_sensitive_content: post.isSensitiveContent,
    likes_count: post._count?.likes || 0,
    saves_count: post._count?.saves || 0,
    shares_count: post._count?.shares || 0,
    reposts_count: post.repostsCount || 0,
    views_count: 0,
    created_at: post.createdAt.toISOString(),
    author: {
      id: post.user.id,
      username: post.user.username,
      display_name: post.user.displayName,
      avatar_url: post.user.avatarUrl,
      tier: post.user.tier,
      allow_reposts: post.user.allowReposts ?? true,
    },
    is_liked: user ? (Array.isArray(post.likes) && post.likes.length > 0) : false,
    is_saved: user ? (Array.isArray(post.saves) && post.saves.length > 0) : false,
    is_following: isFollowingAuthor,
    // Check if the CURRENT USER has reposted this post (not just that it's a repost item)
    is_reposted: user ? (Array.isArray(post.reposts) && post.reposts.length > 0) : false,
    repost_status: user && Array.isArray(post.reposts) && post.reposts.length > 0 ? post.reposts[0].status : null,
    can_repost: canRepost, // Based on allowChainReposts admin setting
  };
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const contentType = formData.get('content_type') as 'shout' | 'image' | 'video' | 'audio' | 'panorama360';
    const textContent = formData.get('text_content') as string | null;
    const headline = formData.get('headline') as string | null;
    const headlineStyle = (formData.get('headline_style') as 'normal' | 'news') || 'normal';
    const visibility = (formData.get('visibility') as 'public' | 'followers' | 'private') || 'public';
    const provenance = formData.get('provenance') as 'original' | 'ai_assisted' | 'ai_generated' | 'composite' | null;
    const media = formData.get('media') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;
    const videoJobId = formData.get('video_job_id') as string | null; // For pre-uploaded videos
    const audioJobId = formData.get('audio_job_id') as string | null; // For pre-uploaded audio
    const isSponsoredContent = formData.get('is_sponsored_content') === 'true'; // Paid promotion declaration
    const isSensitiveContent = formData.get('is_sensitive_content') === 'true'; // Sensitive content declaration

    // Scheduling fields (drops)
    const scheduledForStr = formData.get('scheduled_for') as string | null;
    const hideTeaserStr = formData.get('hide_teaser') as string | null;
    const hideTeaser = hideTeaserStr === 'true';

    // Parse and validate scheduled time
    let status: 'published' | 'scheduled' = 'published';
    let scheduledFor: Date | null = null;

    if (scheduledForStr) {
      scheduledFor = new Date(scheduledForStr);
      if (isNaN(scheduledFor.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduled time' }, { status: 400 });
      }

      // Must be at least 5 minutes in the future
      const minScheduleTime = new Date(Date.now() + 5 * 60 * 1000);
      if (scheduledFor < minScheduleTime) {
        return NextResponse.json(
          { error: 'Scheduled time must be at least 5 minutes in the future' },
          { status: 400 }
        );
      }

      status = 'scheduled';
    }

    // Audience fields for private posts
    const audienceUserIdsStr = formData.get('audience_user_ids') as string | null;
    const audienceGroupIdsStr = formData.get('audience_group_ids') as string | null;

    const audienceUserIds = audienceUserIdsStr ? JSON.parse(audienceUserIdsStr) : [];
    const audienceGroupIds = audienceGroupIdsStr ? JSON.parse(audienceGroupIdsStr) : [];

    // Validate content type
    if (!contentType || !['shout', 'image', 'video', 'audio', 'panorama360'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Validate shouts have text
    if (contentType === 'shout' && !textContent?.trim()) {
      return NextResponse.json({ error: 'Shout must have text content' }, { status: 400 });
    }

    // Validate headline (max 80 chars, no URLs, single line)
    if (headline) {
      const trimmedHeadline = headline.trim().replace(/[\r\n]+/g, ' ');
      if (trimmedHeadline.length > 80) {
        return NextResponse.json({ error: 'Headline must be 80 characters or less' }, { status: 400 });
      }
      // Check for URLs
      const urlPattern = /https?:\/\/|www\./i;
      if (urlPattern.test(trimmedHeadline)) {
        return NextResponse.json({ error: 'Headlines cannot contain URLs' }, { status: 400 });
      }
    }

    // Validate media types have media (video/audio can use jobId instead)
    if (['image', 'panorama360'].includes(contentType) && !media) {
      return NextResponse.json({ error: 'Media file is required' }, { status: 400 });
    }
    if (contentType === 'video' && !media && !videoJobId) {
      return NextResponse.json({ error: 'Video file or job ID is required' }, { status: 400 });
    }
    if (contentType === 'audio' && !media && !audioJobId) {
      return NextResponse.json({ error: 'Audio file or job ID is required' }, { status: 400 });
    }

    // Validate private posts have audience
    if (visibility === 'private' && audienceUserIds.length === 0 && audienceGroupIds.length === 0) {
      return NextResponse.json(
        { error: 'Private posts must have at least one audience member or group' },
        { status: 400 }
      );
    }

    // Validate audience user IDs are followers
    if (visibility === 'private' && audienceUserIds.length > 0) {
      const validFollowers = await prisma.follow.findMany({
        where: {
          followingId: user.id,
          followerId: { in: audienceUserIds },
        },
        select: { followerId: true },
      });

      const validFollowerIds = validFollowers.map((f) => f.followerId);
      const invalidUserIds = audienceUserIds.filter((id: string) => !validFollowerIds.includes(id));

      if (invalidUserIds.length > 0) {
        return NextResponse.json(
          { error: 'Some audience users are not your followers' },
          { status: 400 }
        );
      }
    }

    // Validate audience group IDs belong to the user
    if (visibility === 'private' && audienceGroupIds.length > 0) {
      const validGroups = await prisma.audienceGroup.findMany({
        where: {
          id: { in: audienceGroupIds },
          ownerId: user.id,
        },
        select: { id: true },
      });

      const validGroupIds = validGroups.map((g) => g.id);
      const invalidGroupIds = audienceGroupIds.filter((id: string) => !validGroupIds.includes(id));

      if (invalidGroupIds.length > 0) {
        return NextResponse.json(
          { error: 'Some audience groups do not belong to you' },
          { status: 400 }
        );
      }
    }

    // Upload media if present
    let mediaUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let linkedVideoJob: { id: string; status: string } | null = null;
    let linkedAudioJob: { id: string; status: string } | null = null;

    // Handle video job linking (async video processing)
    if (videoJobId && contentType === 'video') {
      // Verify the VideoJob exists and belongs to this user
      const videoJob = await prisma.videoJob.findUnique({
        where: { id: videoJobId },
        select: { id: true, status: true, userId: true, outputUrl: true, thumbnailUrl: true },
      });

      if (!videoJob) {
        return NextResponse.json({ error: 'Video job not found' }, { status: 404 });
      }

      if (videoJob.userId !== user.id) {
        return NextResponse.json({ error: 'Video job does not belong to you' }, { status: 403 });
      }

      // If job already completed, use the output URLs
      if (videoJob.status === 'completed' && videoJob.outputUrl) {
        mediaUrl = videoJob.outputUrl;
        thumbnailUrl = videoJob.thumbnailUrl;
      } else {
        // Job still processing - post will be created without mediaUrl
        // Worker will update it when processing completes
        linkedVideoJob = { id: videoJob.id, status: videoJob.status };
      }
    } else if (audioJobId && contentType === 'audio') {
      // Handle audio job linking (async audio processing)
      const audioJob = await prisma.videoJob.findUnique({
        where: { id: audioJobId },
        select: { id: true, status: true, userId: true, outputUrl: true, waveformUrl: true },
      });

      if (!audioJob) {
        return NextResponse.json({ error: 'Audio job not found' }, { status: 404 });
      }

      if (audioJob.userId !== user.id) {
        return NextResponse.json({ error: 'Audio job does not belong to you' }, { status: 403 });
      }

      // If job already completed, use the output URLs
      if (audioJob.status === 'completed' && audioJob.outputUrl) {
        mediaUrl = audioJob.outputUrl;
        // Note: waveformUrl is stored on the job, accessible via the post's linked job
      } else {
        // Job still processing - post will be created without mediaUrl
        // Worker will update it when processing completes
        linkedAudioJob = { id: audioJob.id, status: audioJob.status };
      }
    } else if (media) {
      // Direct media upload (images, panoramas, or legacy video path)
      const buffer = Buffer.from(await media.arrayBuffer());
      const key = generateFileKey(user.id, contentType, media.name);
      mediaUrl = await uploadToMinio(key, buffer, media.type);
    }

    if (thumbnail) {
      const buffer = Buffer.from(await thumbnail.arrayBuffer());
      const key = generateFileKey(user.id, 'thumbnail', thumbnail.name);
      thumbnailUrl = await uploadToMinio(key, buffer, thumbnail.type);
    }

    // Create post with audience records in a transaction
    const post = await prisma.$transaction(async (tx) => {
      // Create the post
      const newPost = await tx.post.create({
        data: {
          userId: user.id,
          contentType,
          headline: headline?.trim().replace(/[\r\n]+/g, ' ') || null,
          headlineStyle,
          description: textContent?.trim() || null,
          mediaUrl,
          mediaThumbnailUrl: thumbnailUrl,
          visibility,
          provenance: provenance || 'original',
          status,
          scheduledFor,
          hideTeaser,
          isSponsoredContent,
          isSensitiveContent,
        },
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

      // Link VideoJob to post if we have one
      if (linkedVideoJob) {
        await tx.videoJob.update({
          where: { id: linkedVideoJob.id },
          data: { postId: newPost.id },
        });
      }

      // Link AudioJob to post if we have one
      if (linkedAudioJob) {
        await tx.videoJob.update({
          where: { id: linkedAudioJob.id },
          data: { postId: newPost.id },
        });
      }

      // Create audience user records for private posts
      if (visibility === 'private' && audienceUserIds.length > 0) {
        await tx.postAudienceUser.createMany({
          data: audienceUserIds.map((userId: string) => ({
            postId: newPost.id,
            userId,
          })),
        });
      }

      // Create audience group records for private posts
      if (visibility === 'private' && audienceGroupIds.length > 0) {
        await tx.postAudienceGroup.createMany({
          data: audienceGroupIds.map((groupId: string) => ({
            postId: newPost.id,
            groupId,
          })),
        });
      }

      // Auto-assign interests based on hashtags and keywords
      const interestIds = await matchPostToInterests(textContent, headline);
      if (interestIds.length > 0) {
        await tx.postInterest.createMany({
          data: interestIds.map((interestId) => ({
            postId: newPost.id,
            interestId,
          })),
          skipDuplicates: true,
        });
      }

      return newPost;
    });

    return NextResponse.json({
      post: {
        id: post.id,
        content_type: post.contentType,
        headline: post.headline,
        headline_style: post.headlineStyle,
        text_content: post.description,
        media_url: post.mediaUrl,
        thumbnail_url: post.mediaThumbnailUrl,
        visibility: post.visibility,
        provenance: post.provenance,
        status: post.status,
        scheduled_for: post.scheduledFor?.toISOString() || null,
        hide_teaser: post.hideTeaser,
        is_sponsored_content: post.isSponsoredContent,
        is_sensitive_content: post.isSensitiveContent,
        created_at: post.createdAt.toISOString(),
        user: {
          id: post.user.id,
          username: post.user.username,
          display_name: post.user.displayName,
          avatar_url: post.user.avatarUrl,
          tier: post.user.tier,
        },
        stats: {
          likes: 0,
          saves: 0,
          shares: 0,
        },
        audience: visibility === 'private' ? {
          user_ids: audienceUserIds,
          group_ids: audienceGroupIds,
        } : null,
        // Include video processing status for videos with pending jobs
        video_processing: linkedVideoJob ? {
          job_id: linkedVideoJob.id,
          status: linkedVideoJob.status,
        } : null,
        // Include audio processing status for audio with pending jobs
        audio_processing: linkedAudioJob ? {
          job_id: linkedAudioJob.id,
          status: linkedAudioJob.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
