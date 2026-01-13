'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Bookmark } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { PostCard } from './PostCard';
import type { ContentType } from '@/types/database';

interface SavedFeedContainerProps {
  contentType?: ContentType | null;
  columns?: 1 | 2 | 3;
}

interface Post {
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
  views_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier: string;
  };
  is_liked: boolean;
  is_saved: boolean;
}

async function fetchSavedPosts({
  pageParam,
  contentType,
}: {
  pageParam?: string;
  contentType?: ContentType | null;
}): Promise<{ posts: Post[]; nextCursor?: string }> {
  const params = new URLSearchParams();
  params.set('saved', 'true');
  if (pageParam) params.set('cursor', pageParam);
  if (contentType) params.set('type', contentType);

  const res = await fetch(`/api/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch saved posts');
  return res.json();
}

export function SavedFeedContainer({ contentType, columns = 2 }: SavedFeedContainerProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['saved-posts', contentType],
    queryFn: ({ pageParam }) => fetchSavedPosts({ pageParam, contentType }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
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
        Failed to load saved posts. Please try again.
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark size={48} className="mx-auto text-gray-500 mb-4" />
        <p className="text-gray-500 text-lg">No saved posts yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Tap the bookmark icon on posts to save them for later
        </p>
      </div>
    );
  }

  const breakpointCols = {
    default: columns,
    1024: Math.min(columns, 2),
    640: columns, // Respect user's choice on mobile
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointCols}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {posts.map((post) => (
          <div key={post.id} className="mb-4">
            <PostCard post={post as any} />
          </div>
        ))}
      </Masonry>

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
