'use client';

import { useState } from 'react';
import { Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { BookingBlockData, BookingPlatform } from '@/types/creator-page';
import { BOOKING_PLATFORMS } from '@/types/creator-page';

interface BookingBlockProps {
  data: BookingBlockData | Record<string, unknown>;
  onClick?: () => void;
}

export function BookingBlock({ data, onClick }: BookingBlockProps) {
  const bookingData = data as BookingBlockData;
  const [isExpanded, setIsExpanded] = useState(false);

  const platform = BOOKING_PLATFORMS[bookingData.platform] || BOOKING_PLATFORMS.other;
  const embedHeight = bookingData.embedHeight || 600;

  const handleClick = () => {
    onClick?.();
  };

  // Link Mode - Card with CTA button
  if (bookingData.mode === 'link') {
    return (
      <div
        className={`bg-gray-800 rounded-2xl overflow-hidden border ${
          bookingData.highlight
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-gray-700'
        }`}
      >
        <div className="p-4">
          {/* Platform badge */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: platform.color }}
            >
              <Calendar size={16} className="text-white" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {platform.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-1">
            {bookingData.title}
          </h3>

          {/* Description */}
          {bookingData.description && (
            <p className="text-gray-400 text-sm mb-4">{bookingData.description}</p>
          )}

          {/* CTA Button */}
          <a
            href={bookingData.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-xl transition ${
              bookingData.highlight
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {bookingData.ctaLabel || 'Book Now'}
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    );
  }

  // Embed Mode - Collapsible container with iframe
  return (
    <div
      className={`bg-gray-800 rounded-2xl overflow-hidden border ${
        bookingData.highlight
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-gray-700'
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded) {
            handleClick();
          }
        }}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: platform.color }}
          >
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {bookingData.title}
            </h3>
            {bookingData.description && !isExpanded && (
              <p className="text-gray-400 text-sm">{bookingData.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-emerald-400">
            {isExpanded ? 'Close' : 'Open'}
          </span>
          {isExpanded ? (
            <ChevronUp className="text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-400" size={20} />
          )}
        </div>
      </button>

      {/* Expanded content - Iframe */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {bookingData.description && (
            <p className="px-4 pt-3 text-gray-400 text-sm">
              {bookingData.description}
            </p>
          )}
          <div className="p-4">
            <iframe
              src={bookingData.url}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              className="rounded-lg bg-white"
              title={`${platform.label} booking widget`}
            />
          </div>
          <div className="px-4 pb-3 text-center">
            <span className="text-xs text-gray-500">
              Powered by {platform.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
