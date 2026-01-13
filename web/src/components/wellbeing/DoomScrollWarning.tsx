'use client';

import { Coffee, X } from 'lucide-react';
import { useDoomScrollStore, formatDuration } from '@/stores/doomScrollStore';

interface DoomScrollWarningProps {
  title: string;
  message: string;
  postsViewed: number;
  timeElapsed: number;
  breakDurationSeconds: number;
  onDismiss: () => void;
  onTakeBreak: () => void;
}

export function DoomScrollWarning({
  title,
  message,
  postsViewed,
  timeElapsed,
  breakDurationSeconds,
  onDismiss,
  onTakeBreak,
}: DoomScrollWarningProps) {
  const { startBreak } = useDoomScrollStore();

  // Replace placeholders in message
  const formattedMessage = message
    .replace('{posts}', postsViewed.toString())
    .replace('{time}', formatDuration(timeElapsed));

  const handleTakeBreak = () => {
    startBreak(breakDurationSeconds);
    onTakeBreak();
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 min-w-0">
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-6 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-amber-400 truncate">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
          {formattedMessage}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-1.5 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">Posts:</span>{' '}
            <span className="text-white font-medium">{postsViewed}</span>
          </div>
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">Time:</span>{' '}
            <span className="text-white font-medium">{formatDuration(timeElapsed)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleTakeBreak}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition text-sm sm:text-base"
          >
            Take a Break
          </button>
          <button
            onClick={onDismiss}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm sm:text-base"
          >
            Keep Scrolling
          </button>
        </div>
      </div>
    </div>
  );
}
