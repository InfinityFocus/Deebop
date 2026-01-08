'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TrendingCarouselProps {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
  emptyMessage?: string;
}

export default function TrendingCarousel({
  title,
  seeAllHref,
  children,
  emptyMessage = 'Nothing trending yet',
}: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const hasChildren =
    Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            See all →
          </Link>
        )}
      </div>

      {hasChildren ? (
        <>
          {/* Scroll left button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 mt-4 -translate-y-1/2 z-10 p-2 bg-zinc-900/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-zinc-700 hover:bg-zinc-800"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Content container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {children}
          </div>

          {/* Scroll right button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 mt-4 -translate-y-1/2 z-10 p-2 bg-zinc-900/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-zinc-700 hover:bg-zinc-800"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Gradient fade edges */}
          <div className="absolute left-0 top-10 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-10 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="py-8 text-center text-zinc-500">{emptyMessage}</div>
      )}
    </div>
  );
}
