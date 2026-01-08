'use client';

import { Flame } from 'lucide-react';

interface JustDroppedBadgeProps {
  droppedAt: string | null;
  className?: string;
}

export function JustDroppedBadge({ droppedAt, className = '' }: JustDroppedBadgeProps) {
  if (!droppedAt) return null;

  // Check if dropped within the last 24 hours
  const droppedTime = new Date(droppedAt);
  const now = new Date();
  const hoursSinceDropped = (now.getTime() - droppedTime.getTime()) / (1000 * 60 * 60);

  if (hoursSinceDropped > 24) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-full ${className}`}
    >
      <Flame className="w-3 h-3" />
      Just Dropped
    </span>
  );
}

// Helper function to check if something just dropped (for use outside React)
export function isJustDropped(droppedAt: string | null): boolean {
  if (!droppedAt) return false;

  const droppedTime = new Date(droppedAt);
  const now = new Date();
  const hoursSinceDropped = (now.getTime() - droppedTime.getTime()) / (1000 * 60 * 60);

  return hoursSinceDropped <= 24;
}
