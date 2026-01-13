'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface TaggedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface TagIndicatorProps {
  tag: {
    id: string;
    positionX: number;
    positionY: number;
    status: string;
    taggedUser: TaggedUser;
  };
  isOwner?: boolean;
  onRemove?: (tagId: string) => void;
  showAlways?: boolean;
}

export function TagIndicator({ tag, isOwner, onRemove, showAlways = false }: TagIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(showAlways);

  // Calculate tooltip position to avoid overflow
  const tooltipOnLeft = tag.positionX > 70;
  const tooltipOnTop = tag.positionY > 80;

  return (
    <div
      className="absolute z-10"
      style={{
        left: `${tag.positionX}%`,
        top: `${tag.positionY}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showAlways) setShowTooltip(false);
      }}
    >
      {/* Tag dot indicator */}
      <div
        className={clsx(
          'w-6 h-6 rounded-full border-2 border-white cursor-pointer transition-all duration-200',
          tag.status === 'pending' ? 'bg-yellow-500/80' : 'bg-black/60',
          isHovered && 'scale-125'
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* Tooltip with username */}
      {showTooltip && (
        <div
          className={clsx(
            'absolute whitespace-nowrap z-20',
            tooltipOnLeft ? 'right-full mr-2' : 'left-full ml-2',
            tooltipOnTop ? 'bottom-0' : 'top-0'
          )}
        >
          <div className="bg-black/90 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
            {tag.taggedUser.avatarUrl ? (
              <img
                src={tag.taggedUser.avatarUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                {tag.taggedUser.username[0].toUpperCase()}
              </div>
            )}
            <Link
              href={`/u/${tag.taggedUser.username}`}
              className="text-white text-sm font-medium hover:underline"
            >
              @{tag.taggedUser.username}
            </Link>
            {tag.status === 'pending' && (
              <span className="text-xs text-yellow-400 ml-1">(pending)</span>
            )}
            {isOwner && onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(tag.id);
                }}
                className="ml-1 text-gray-400 hover:text-red-400 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
