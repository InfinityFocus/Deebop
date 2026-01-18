'use client';

import type { PresenceStatus } from '@/types';
import { getPresenceStatusColor } from '@/lib/presence';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Small colored dot indicating presence status
 * - Green = online
 * - Yellow = away
 * - Gray = offline
 */
export function PresenceIndicator({
  status,
  size = 'sm',
  className = '',
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClass = getPresenceStatusColor(status);

  return (
    <span
      className={`${sizeClasses[size]} ${colorClass} rounded-full border-2 border-dark-800 ${className}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}
