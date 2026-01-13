'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { TaggingOverlay } from '@/components/tagging';

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
  postId?: string;
  isOwner?: boolean;
}

// Prevent right-click/long-press to save media
const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  return false;
};

export function ImageCarousel({ images, className, postId, isOwner = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Sort images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Update current index based on scroll position (debounced)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    // Debounce the index update to avoid jerkiness
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.clientWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex >= 0 && newIndex < sortedImages.length) {
          setCurrentIndex(newIndex);
        }
      }
    }, 50);
  }, [sortedImages.length]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  if (sortedImages.length === 0) return null;

  // Single image - no carousel needed
  if (sortedImages.length === 1) {
    const image = sortedImages[0];
    const imageElement = (
      <img
        src={image.media_url}
        alt={image.alt_text || ''}
        className={clsx('w-full max-h-[95vh] object-contain select-none', className)}
        onContextMenu={preventContextMenu}
        draggable={false}
      />
    );

    if (postId) {
      return (
        <TaggingOverlay
          postId={postId}
          mediaId={image.id}
          contentType="image"
          isOwner={isOwner}
        >
          {imageElement}
        </TaggingOverlay>
      );
    }

    return imageElement;
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

      {/* Scrollable container with snap - uses native scroll behavior */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain', // Prevents horizontal overscroll from triggering page navigation
        }}
      >
        {sortedImages.map((image, index) => {
          const imageElement = (
            <img
              src={image.media_url}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full max-h-[95vh] object-contain select-none"
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
              onContextMenu={preventContextMenu}
            />
          );

          return (
            <div
              key={image.id}
              className="flex-none w-full snap-center"
              style={{ scrollSnapStop: 'always' }}
              onContextMenu={preventContextMenu}
            >
              {postId ? (
                <TaggingOverlay
                  postId={postId}
                  mediaId={image.id}
                  contentType="image"
                  isOwner={isOwner}
                >
                  {imageElement}
                </TaggingOverlay>
              ) : (
                imageElement
              )}
            </div>
          );
        })}
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
