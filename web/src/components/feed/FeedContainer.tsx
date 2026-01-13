'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Loader2, Users, Star } from 'lucide-react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { PostCard } from './PostCard';
import { RepostedPostCard } from './RepostedPostCard';
import { AdCard, BoostedPostCard } from '@/components/ads';
import { UpcomingDropsSection } from '@/components/drops/UpcomingDropsSection';
import { DoomScrollWarning } from '@/components/wellbeing/DoomScrollWarning';
import { BreakOverlay } from '@/components/wellbeing/BreakOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useDoomScrollStore } from '@/stores/doomScrollStore';
import type { ContentType } from '@/types/database';
import type { FeedMode } from '@/stores/feedPreferencesStore';

interface DoomScrollSettings {
  isEnabled: boolean;
  postsThreshold: number;
  timeThresholdSeconds: number;
  breakDurationSeconds: number;
  title: string;
  message: string;
}

interface FeedContainerProps {
  contentType?: ContentType | null;
  userId?: string;
  mode?: FeedMode;
  highlightPostId?: string;
  columns?: 1 | 2 | 3;
}

interface Post {
  type?: 'post' | 'repost';
  id: string;
  user_id: string;
  content_type: ContentType;
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_width: number | null;
  media_height: number | null;
  media_duration_seconds: number | null;
  provenance: string;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  reposts_count?: number;
  views_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier: string;
    allow_reposts?: boolean;
  };
  is_liked: boolean;
  is_saved: boolean;
  is_following?: boolean;
  // Repost-specific fields
  repost_id?: string;
  reposter?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  reposted_at?: string;
  post_id?: string;
  is_reposted?: boolean;
  repost_status?: string | null;
  can_repost?: boolean;
}

interface AdResponse {
  type?: 'ad' | 'boost';
  ad?: {
    id: string;
    image_url: string;
    headline: string;
    destination_url: string;
  };
  boost?: {
    id: string;
    post: Post;
  };
  frequency?: number;
  reason?: string;
}

async function fetchPosts({
  pageParam,
  contentType,
  userId,
  mode,
}: {
  pageParam?: string;
  contentType?: ContentType | null;
  userId?: string;
  mode?: FeedMode;
}): Promise<{ posts: Post[]; nextCursor?: string; empty_reason?: string }> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);
  if (contentType) params.set('type', contentType);
  if (userId) params.set('userId', userId);
  if (mode) params.set('mode', mode);

  const res = await fetch(`/api/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

async function fetchAd(feedMode: FeedMode): Promise<AdResponse> {
  const res = await fetch(`/api/ads/serve?feedMode=${feedMode}`);
  if (!res.ok) return { reason: 'error' };
  return res.json();
}

// Default fallback frequency if not provided by API
const DEFAULT_AD_INTERVAL = 5;

async function fetchDoomScrollSettings(): Promise<DoomScrollSettings | null> {
  try {
    const res = await fetch('/api/wellbeing/settings');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface UserPreferences {
  doomScrollPreference: string;
}

async function fetchUserPreferences(): Promise<UserPreferences | null> {
  try {
    const res = await fetch('/api/users/me/preferences');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function FeedContainer({ contentType, userId, mode = 'discovery', highlightPostId, columns = 1 }: FeedContainerProps) {
  const { user } = useAuth();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasScrolledToHighlight = useRef(false);
  const lastPostCountRef = useRef(0);
  const [showDoomWarning, setShowDoomWarning] = useState(false);

  // Doom scroll tracking
  const {
    postsViewed,
    incrementPosts,
    dismissWarning,
    shouldShowWarning,
    getTimeElapsed,
    isBreakActive,
  } = useDoomScrollStore();

  const [showBreakOverlay, setShowBreakOverlay] = useState(false);

  // Pro users never see ads
  const showAds = user?.tier !== 'pro';

  // Fetch doom scroll settings
  const { data: doomScrollSettings } = useQuery({
    queryKey: ['doom-scroll-settings'],
    queryFn: fetchDoomScrollSettings,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch user preferences (only if logged in)
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
    staleTime: 60000,
    enabled: !!user, // Only fetch if logged in
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['posts', contentType, userId, mode],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, contentType, userId, mode }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  // Fetch ads for non-Pro users (API filters by feed mode)
  const { data: adData } = useQuery({
    queryKey: ['ad', mode],
    queryFn: () => fetchAd(mode),
    enabled: showAds,
    refetchInterval: 60000, // Refresh ad every minute
    staleTime: 30000,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Track posts viewed and check doom scroll threshold
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  // Scroll to highlighted post if specified
  useEffect(() => {
    if (highlightPostId && posts.length > 0 && !hasScrolledToHighlight.current) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(`post-${highlightPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-pulse');
          setTimeout(() => element.classList.remove('highlight-pulse'), 2000);
          hasScrolledToHighlight.current = true;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightPostId, posts.length]);


  useEffect(() => {
    // Increment posts viewed when new posts are loaded
    const currentPostCount = posts.length;
    if (currentPostCount > lastPostCountRef.current) {
      const newPosts = currentPostCount - lastPostCountRef.current;
      for (let i = 0; i < newPosts; i++) {
        incrementPosts();
      }
      lastPostCountRef.current = currentPostCount;
    }
  }, [posts.length, incrementPosts]);

  // Check if we should show doom scroll warning
  useEffect(() => {
    // Get user preference (default to "on" for anonymous users)
    const preference = userPreferences?.doomScrollPreference || 'on';

    // If user has turned off doom scroll reminders, never show
    if (preference === 'off') {
      setShowDoomWarning(false);
      return;
    }

    if (!doomScrollSettings?.isEnabled) {
      setShowDoomWarning(false);
      return;
    }

    // Apply multiplier based on preference
    // "reduced" doubles the thresholds, "on" uses default
    const multiplier = preference === 'reduced' ? 2 : 1;

    const checkWarning = () => {
      const shouldShow = shouldShowWarning(
        doomScrollSettings.postsThreshold * multiplier,
        doomScrollSettings.timeThresholdSeconds * multiplier
      );
      setShowDoomWarning(shouldShow);
    };

    // Check immediately
    checkWarning();

    // Check periodically (every 10 seconds) for time-based threshold
    const interval = setInterval(checkWarning, 10000);
    return () => clearInterval(interval);
  }, [doomScrollSettings, userPreferences, shouldShowWarning, postsViewed]);

  // Sync break overlay with store state
  useEffect(() => {
    const checkBreakStatus = () => {
      setShowBreakOverlay(isBreakActive());
    };
    checkBreakStatus();
    const interval = setInterval(checkBreakStatus, 1000);
    return () => clearInterval(interval);
  }, [isBreakActive]);

  const handleDismissDoomWarning = () => {
    dismissWarning();
    setShowDoomWarning(false);
  };

  const handleTakeBreak = () => {
    setShowDoomWarning(false);
    setShowBreakOverlay(true);
  };

  const handleBreakEnd = () => {
    setShowBreakOverlay(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-400">
        Failed to load posts. Please try again.
      </div>
    );
  }

  const emptyReason = data?.pages[0]?.empty_reason;

  if (posts.length === 0) {
    // Different empty states for Following, Favourites, and Discovery
    if (mode === 'following') {
      if (emptyReason === 'not_following_anyone') {
        return (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Follow some accounts to see their posts here</p>
            <Link
              href="/explore"
              className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Discover people to follow
            </Link>
          </div>
        );
      }
      return (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No posts from people you follow yet</p>
          <p className="text-gray-500 text-sm mt-2">Check back later or explore more accounts</p>
        </div>
      );
    }

    if (mode === 'favourites') {
      if (emptyReason === 'no_favourites') {
        return (
          <div className="text-center py-16">
            <Star className="w-12 h-12 mx-auto text-yellow-500/50 mb-4" />
            <p className="text-gray-400 text-lg">Star your favourite creators</p>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              Visit profiles and tap the star icon to add them to your Favourites feed
            </p>
            <Link
              href="/explore"
              className="inline-block mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Discover creators
            </Link>
          </div>
        );
      }
      return (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No posts from your favourites yet</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for new content</p>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No posts yet</p>
        <p className="text-gray-400 text-sm mt-2">Be the first to share something!</p>
      </div>
    );
  }

  // Render posts with ads interspersed
  const renderFeedItems = () => {
    const items: React.ReactNode[] = [];

    // Use frequency from API response, fallback to default
    const adFrequency = adData?.frequency || DEFAULT_AD_INTERVAL;

    posts.forEach((post, index) => {
      // Check if this is a repost
      if (post.type === 'repost' && post.reposter && post.reposted_at) {
        items.push(
          <RepostedPostCard
            key={post.id}
            repost={post as any}
          />
        );
      } else {
        items.push(<PostCard key={post.id} post={post as any} />);
      }

      // Insert ad after every adFrequency posts
      if (showAds && (index + 1) % adFrequency === 0 && adData) {
        if (adData.type === 'boost' && adData.boost) {
          items.push(
            <BoostedPostCard
              key={`boost-${index}`}
              boostId={adData.boost.id}
              post={adData.boost.post}
            />
          );
        } else if (adData.type === 'ad' && adData.ad) {
          items.push(<AdCard key={`ad-${index}`} ad={adData.ad} />);
        }
      }
    });

    // Add doom scroll warning if threshold reached
    if (showDoomWarning && doomScrollSettings) {
      items.push(
        <DoomScrollWarning
          key="doom-scroll-warning"
          title={doomScrollSettings.title}
          message={doomScrollSettings.message}
          postsViewed={postsViewed}
          timeElapsed={getTimeElapsed()}
          breakDurationSeconds={doomScrollSettings.breakDurationSeconds}
          onDismiss={handleDismissDoomWarning}
          onTakeBreak={handleTakeBreak}
        />
      );
    }

    return items;
  };

  const breakpointCols = {
    default: columns,
    1024: Math.min(columns, 2),
    640: columns, // Respect user's choice on mobile
  };

  return (
    <>
      {/* Break overlay - shown when user takes a break */}
      {showBreakOverlay && <BreakOverlay onBreakEnd={handleBreakEnd} />}

      {/* Show upcoming drops section on main feed (not profile feeds) */}
      {!userId && <UpcomingDropsSection mode={mode} />}

      {columns === 1 ? (
        <div className="space-y-4">
          {renderFeedItems()}
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointCols}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {renderFeedItems().map((item, index) => (
            <div key={index} className="mb-4">
              {item}
            </div>
          ))}
        </Masonry>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    </>
  );
}
