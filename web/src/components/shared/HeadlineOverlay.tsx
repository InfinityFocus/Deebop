'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag, Newspaper } from 'lucide-react';
import { clsx } from 'clsx';
import { renderRichText } from '@/lib/text-utils';

export interface HeadlineOverlayProps {
  headline: string;
  description?: string | null;
  style?: 'normal' | 'news';
  isFlagged?: boolean;
  className?: string;
  approvedMentions?: Set<string>;
}

export function HeadlineOverlay({
  headline,
  description,
  style = 'normal',
  isFlagged = false,
  className,
  approvedMentions,
}: HeadlineOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDescription = description && description.trim().length > 0;

  const isNewsStyle = style === 'news';

  return (
    <div
      className={clsx(
        'absolute top-0 left-0 right-0 transition-all duration-300',
        isExpanded ? 'max-h-[60%] overflow-auto' : 'max-h-24',
        className
      )}
    >
      {/* Background overlay */}
      <div
        className={clsx(
          'absolute inset-0',
          isNewsStyle
            ? 'bg-gradient-to-b from-amber-900/80 via-amber-900/60 to-transparent'
            : 'bg-gradient-to-b from-black/80 via-black/50 to-transparent'
        )}
      />

      {/* Content */}
      <div className="relative p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2">
          {isNewsStyle && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded uppercase">
              <Newspaper size={12} />
              News
            </span>
          )}
          {isFlagged && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/80 text-white text-xs font-medium rounded">
              <Flag size={10} />
              Flagged
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          className={clsx(
            'text-white leading-tight mb-1',
            isNewsStyle ? 'font-serif text-lg font-semibold' : 'font-sans text-base font-medium'
          )}
        >
          {renderRichText(headline, approvedMentions)}
        </h3>

        {/* Description (expandable) */}
        {hasDescription && (
          <>
            <div
              className={clsx(
                'text-white/80 text-sm transition-all duration-300 overflow-hidden',
                isExpanded ? 'max-h-96' : 'max-h-0'
              )}
            >
              <p className="whitespace-pre-wrap">{renderRichText(description!, approvedMentions)}</p>
            </div>

            {/* Expand/Collapse button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-2 flex items-center gap-1 text-white/60 hover:text-white text-xs transition"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Show more
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Compact version for grid/card views
export function HeadlineOverlayCompact({
  headline,
  style = 'normal',
  isFlagged = false,
  className,
  approvedMentions,
}: Omit<HeadlineOverlayProps, 'description'>) {
  const isNewsStyle = style === 'news';

  return (
    <div
      className={clsx(
        'absolute top-0 left-0 right-0 p-3',
        className
      )}
    >
      {/* Background */}
      <div
        className={clsx(
          'absolute inset-0',
          isNewsStyle
            ? 'bg-gradient-to-b from-amber-900/80 to-transparent'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        )}
      />

      {/* Content */}
      <div className="relative flex items-center gap-2">
        {isNewsStyle && (
          <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded uppercase">
            News
          </span>
        )}
        {isFlagged && (
          <Flag size={12} className="flex-shrink-0 text-red-400" />
        )}
        <span
          className={clsx(
            'text-white line-clamp-2 text-sm',
            isNewsStyle ? 'font-serif font-semibold' : 'font-sans font-medium'
          )}
        >
          {renderRichText(headline, approvedMentions)}
        </span>
      </div>
    </div>
  );
}
