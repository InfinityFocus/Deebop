'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { TestimonialsBlockData, TestimonialItem } from '@/types/creator-page';

interface TestimonialsBlockProps {
  data: TestimonialsBlockData | Record<string, unknown>;
}

// Get initials from author name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-600'
          }
        />
      ))}
    </div>
  );
}

export function TestimonialsBlock({ data }: TestimonialsBlockProps) {
  const blockData = data as TestimonialsBlockData;
  const items = blockData.items || [];
  const showRating = blockData.showRating !== false;
  const autoRotate = blockData.autoRotate || false;
  const rotationSpeed = blockData.rotationSpeed || 5;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  // Scroll handlers
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -container.clientWidth * 0.8, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' });
  };

  // Pause auto-rotate on user interaction
  const handleInteraction = () => {
    if (!autoRotate) return;
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume after 10s
  };

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate || isPaused || items.length <= 1) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // If at end, scroll to start
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' });
      }
    }, rotationSpeed * 1000);

    return () => clearInterval(interval);
  }, [autoRotate, isPaused, rotationSpeed, items.length]);

  // Initial scroll check
  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white text-center">
          {blockData.heading}
        </h3>
      )}

      <div className="relative">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => { scrollLeft(); handleInteraction(); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition -ml-2"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => { scrollRight(); handleInteraction(); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition -mr-2"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          onMouseDown={handleInteraction}
          onTouchStart={handleInteraction}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[85vw] sm:w-[350px] snap-center bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center"
            >
              {/* Author avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden mb-4 ring-2 ring-gray-600">
                {item.authorImageUrl ? (
                  <Image
                    src={item.authorImageUrl}
                    alt={item.authorName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(item.authorName)}
                  </div>
                )}
              </div>

              {/* Author info */}
              <div className="mb-3">
                <div className="font-semibold text-white">{item.authorName}</div>
                {item.authorRole && (
                  <div className="text-sm text-gray-400">{item.authorRole}</div>
                )}
              </div>

              {/* Rating */}
              {showRating && item.rating && (
                <div className="mb-4">
                  <StarRating rating={item.rating} />
                </div>
              )}

              {/* Quote */}
              <p className="text-gray-300 italic flex-1 leading-relaxed">
                "{item.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
