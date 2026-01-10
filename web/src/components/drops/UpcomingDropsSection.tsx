'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { DropCountdownCard } from './DropCountdownCard';
import { clsx } from 'clsx';

interface Drop {
  id: string;
  type: 'post' | 'album';
  content_type: string;
  title: string | null;
  headline_style?: string;
  description: string | null;
  preview_url: string | null;
  hide_teaser: boolean;
  visibility: string;
  scheduled_for: string;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    tier?: string;
  };
  is_own: boolean;
}

interface UpcomingDropsSectionProps {
  mode?: 'discovery' | 'following' | 'favourites';
}

export function UpcomingDropsSection({ mode = 'following' }: UpcomingDropsSectionProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Use public endpoint for discovery mode (all public drops), upcoming for following/favourites mode
  const apiEndpoint = mode === 'discovery' ? '/api/drops/public' : '/api/drops/upcoming';

  // Fetch upcoming drops
  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const response = await fetch(`${apiEndpoint}?limit=10`);
        if (response.ok) {
          const data = await response.json();
          setDrops(data.drops || []);
        }
      } catch (error) {
        console.error('Failed to fetch upcoming drops:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrops();
    // Refresh every minute to update countdowns
    const interval = setInterval(fetchDrops, 60000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  // Check scroll state
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        scrollEl.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [drops]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Don't render if no drops
  if (!isLoading && drops.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Upcoming Drops</h2>
          <span className="text-sm text-zinc-500">({drops.length})</span>
        </div>

        {/* Navigation arrows */}
        {drops.length > 2 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={clsx(
                'p-1.5 rounded-full transition-colors',
                canScrollLeft
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={clsx(
                'p-1.5 rounded-full transition-colors',
                canScrollRight
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-48 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
            >
              <div className="h-32 bg-zinc-800" />
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-zinc-800 rounded w-20" />
                    <div className="h-2 bg-zinc-800 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-800 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : drops.length === 1 ? (
        // Single drop - full width
        <DropCountdownCard drop={drops[0]} />
      ) : (
        // Multiple drops - horizontal carousel
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {drops.map((drop) => (
            <div key={`${drop.type}-${drop.id}`} style={{ scrollSnapAlign: 'start' }}>
              <DropCountdownCard drop={drop} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
