'use client';

import { Clock } from 'lucide-react';
import { useCountdown, formatCountdown } from '@/hooks/useCountdown';
import { TIMEOUT_REASONS, type TimeoutReason } from '@/types';

interface Props {
  endAt: string;
  startAt?: string;
  reason?: TimeoutReason | null;
  isCountdown?: boolean; // true = counting down to pause, false = paused
}

export function TimeoutBanner({ endAt, startAt, reason, isCountdown = false }: Props) {
  // If isCountdown, we're counting down to when the pause starts
  // If not, we're showing how long the pause lasts
  const targetDate = isCountdown && startAt ? startAt : endAt;
  const countdown = useCountdown(targetDate);

  const reasonData = reason ? TIMEOUT_REASONS.find((r) => r.value === reason) : null;

  // If countdown expired and this was the pre-pause countdown, don't show anything
  // (the parent component will handle showing the overlay)
  if (isCountdown && countdown.isExpired) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
        isCountdown
          ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
          : 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
      }`}
    >
      <Clock size={16} className="flex-shrink-0" />
      <span className="flex-1">
        {isCountdown ? (
          <>
            Wrap up: chat pauses in{' '}
            <span className="font-mono font-semibold">{formatCountdown(countdown)}</span>
            {reasonData && (
              <span className="ml-1">
                ({reasonData.emoji} {reasonData.label})
              </span>
            )}
          </>
        ) : (
          <>
            Chat is paused
            {reasonData && (
              <span className="ml-1">
                for {reasonData.label.toLowerCase()} {reasonData.emoji}
              </span>
            )}
          </>
        )}
      </span>
    </div>
  );
}
