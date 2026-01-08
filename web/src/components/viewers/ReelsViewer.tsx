'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { ReelCard } from './ReelCard';
import { BreakOverlay } from '@/components/wellbeing/BreakOverlay';
import { useDoomScrollStore } from '@/stores/doomScrollStore';

interface Reel {
  id: string;
  media_url: string;
  media_thumbnail_url: string | null;
  text_content: string | null;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  views_count: number;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  is_liked: boolean;
  is_saved: boolean;
}

async function fetchReels({ pageParam }: { pageParam?: string }) {
  const params = new URLSearchParams();
  params.set('type', 'video');
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reels');

  const data = await res.json();

  // Transform posts to reels format
  return {
    reels: data.posts.map((post: any) => ({
      id: post.id,
      media_url: post.media_url,
      media_thumbnail_url: post.media_thumbnail_url,
      text_content: post.text_content,
      likes_count: post.likes_count,
      saves_count: post.saves_count,
      shares_count: post.shares_count,
      views_count: post.views_count,
      author: post.author,
      is_liked: post.is_liked,
      is_saved: post.is_saved,
    })),
    nextCursor: data.nextCursor,
  };
}

export function ReelsViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const isScrolling = useRef(false);
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);

  const { isBreakActive } = useDoomScrollStore();

  // Sync break overlay with store state
  useEffect(() => {
    const checkBreakStatus = () => {
      setShowBreakOverlay(isBreakActive());
    };
    checkBreakStatus();
    const interval = setInterval(checkBreakStatus, 1000);
    return () => clearInterval(interval);
  }, [isBreakActive]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: fetchReels,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const reels = data?.pages.flatMap((page) => page.reels) ?? [];

  // Handle scroll to detect active reel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrolling.current) return;

      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
      }

      // Load more when near the end
      if (newIndex >= reels.length - 2 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        navigateToReel(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        navigateToReel(activeIndex - 1);
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const navigateToReel = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= reels.length) return;

      isScrolling.current = true;
      setActiveIndex(index);

      container.scrollTo({
        top: index * container.clientHeight,
        behavior: 'smooth',
      });

      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    },
    [reels.length]
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>Failed to load videos. Please try again.</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-xl font-semibold mb-2">No videos yet</p>
        <p className="text-gray-400">Be the first to share a video!</p>
      </div>
    );
  }

  return (
    <>
      {/* Break overlay - shown when user takes a break */}
      {showBreakOverlay && <BreakOverlay onBreakEnd={() => setShowBreakOverlay(false)} />}

      <div className="relative h-screen bg-black">
        {/* Reels container */}
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
        {reels.map((reel, index) => (
          <div key={reel.id} className="h-screen w-full">
            <ReelCard
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          </div>
        ))}

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Navigation hints (desktop) */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2">
        <button
          onClick={() => navigateToReel(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronUp size={24} />
        </button>
        <button
          onClick={() => navigateToReel(activeIndex + 1)}
          disabled={activeIndex === reels.length - 1 && !hasNextPage}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronDown size={24} />
        </button>
      </div>

        {/* Reel counter */}
        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          {activeIndex + 1} / {reels.length}
        </div>
      </div>
    </>
  );
}
