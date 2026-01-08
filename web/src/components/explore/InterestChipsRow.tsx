'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useExplorePreferencesStore } from '@/stores/explorePreferencesStore';
import type { Interest } from '@/types/explore';

interface InterestChipsRowProps {
  interests: Interest[];
  onManageClick?: () => void;
}

export default function InterestChipsRow({
  interests,
  onManageClick,
}: InterestChipsRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedInterest, setSelectedInterest } = useExplorePreferencesStore();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleChipClick = (interest: Interest | null) => {
    setSelectedInterest(interest);
  };

  return (
    <div className="relative group">
      {/* Scroll left button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-zinc-900/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-zinc-700"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Chips container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1 pl-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* For You chip (always first) */}
        <button
          onClick={() => handleChipClick(null)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedInterest === null
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          For You
        </button>

        {/* Interest chips */}
        {interests.map((interest) => (
          <button
            key={interest.id}
            onClick={() => handleChipClick(interest)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedInterest?.id === interest.id
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {interest.iconEmoji && <span>{interest.iconEmoji}</span>}
            {interest.name}
          </button>
        ))}

        {/* Manage interests button */}
        {onManageClick && (
          <button
            onClick={onManageClick}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 border border-dashed border-zinc-600 transition-all"
          >
            + Edit Interests
          </button>
        )}
      </div>

      {/* Scroll right button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-zinc-900/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-zinc-700"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
}
