'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CarouselImage {
  id: string;
  media_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  sort_order: number;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Touch handling state for controlled swipe
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef(false);

  // Sort images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Update current index based on scroll position
  const handleScroll = useCallback(() => {
    if (scrollRef.current && !isSwiping.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sortedImages.length) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, sortedImages.length]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollTo(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < sortedImages.length - 1) {
      scrollTo(currentIndex + 1);
    }
  };

  // Touch event handlers for controlled swipe behavior
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < sortedImages.length - 1) {
        // Swipe left - go to next
        scrollTo(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - go to previous
        scrollTo(currentIndex - 1);
      } else {
        // Bounce back to current position
        scrollTo(currentIndex);
      }
    } else {
      // Didn't meet threshold, snap back to current
      scrollTo(currentIndex);
    }
  };

  if (sortedImages.length === 0) return null;

  // Single image - no carousel needed
  if (sortedImages.length === 1) {
    return (
      <img
        src={sortedImages[0].media_url}
        alt={sortedImages[0].alt_text || ''}
        className={clsx('w-full max-h-[95vh] object-contain', className)}
      />
    );
  }

  return (
    <div
      className={clsx('relative group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image counter badge */}
      <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-sm px-2.5 py-1 rounded-full font-medium">
        {currentIndex + 1} / {sortedImages.length}
      </div>

      {/* Scrollable container with snap */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className="flex-none w-full snap-center snap-always"
          >
            <img
              src={image.media_url}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full max-h-[95vh] object-contain"
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Previous button - desktop only, show on hover */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className={clsx(
            'absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 rounded-full text-white transition-opacity shadow-lg hover:bg-black/80',
            'hidden sm:flex items-center justify-center',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next button - desktop only, show on hover */}
      {currentIndex < sortedImages.length - 1 && (
        <button
          onClick={goToNext}
          className={clsx(
            'absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 rounded-full text-white transition-opacity shadow-lg hover:bg-black/80',
            'hidden sm:flex items-center justify-center',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {sortedImages.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={clsx(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/70'
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
