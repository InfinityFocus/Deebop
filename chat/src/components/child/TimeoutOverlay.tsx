'use client';

import { Clock, Coffee, Moon, Utensils, BookOpen } from 'lucide-react';
import { useCountdown, formatCountdownHuman } from '@/hooks/useCountdown';
import { type TimeoutReason } from '@/types';

interface Props {
  endAt: string;
  reason?: TimeoutReason | null;
  friendName?: string; // If viewing from friend's perspective
}

export function TimeoutOverlay({ endAt, reason, friendName }: Props) {
  const countdown = useCountdown(endAt);

  // Get icon and message based on reason
  const getReasonDisplay = () => {
    switch (reason) {
      case 'dinner':
        return {
          icon: <Utensils size={48} className="text-orange-400" />,
          message: friendName
            ? `${friendName} is having dinner`
            : "Time for dinner!",
          emoji: '🍽️',
        };
      case 'bedtime':
        return {
          icon: <Moon size={48} className="text-indigo-400" />,
          message: friendName
            ? `${friendName} is getting ready for bed`
            : "Time for bed!",
          emoji: '🌙',
        };
      case 'school':
        return {
          icon: <BookOpen size={48} className="text-blue-400" />,
          message: friendName
            ? `${friendName} is at school`
            : "Time for school!",
          emoji: '📚',
        };
      case 'break':
        return {
          icon: <Coffee size={48} className="text-amber-400" />,
          message: friendName
            ? `${friendName} is taking a break`
            : "Taking a break!",
          emoji: '☕',
        };
      default:
        return {
          icon: <Clock size={48} className="text-cyan-400" />,
          message: friendName
            ? `${friendName} is taking a break`
            : "Chat is paused for a bit",
          emoji: '⏸️',
        };
    }
  };

  const { icon, message } = getReasonDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/95 backdrop-blur-sm">
      <div className="text-center px-8 max-w-sm">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-dark-700 flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Message */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {message}
        </h2>

        <p className="text-gray-400 mb-6">
          {friendName
            ? "You can't message right now."
            : "You can continue later."}
        </p>

        {/* Time remaining */}
        {!countdown.isExpired && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 rounded-full text-gray-300">
            <Clock size={16} />
            <span>Back in {formatCountdownHuman(countdown)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
