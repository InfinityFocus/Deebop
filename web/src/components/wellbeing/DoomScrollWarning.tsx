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
    <div className="w-full max-w-xl mx-auto my-4">
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Coffee className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-amber-400">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          {formattedMessage}
        </p>

        {/* Stats */}
        <div className="flex gap-4 mb-6 text-sm">
          <div className="px-3 py-1.5 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">Posts viewed:</span>{' '}
            <span className="text-white font-medium">{postsViewed}</span>
          </div>
          <div className="px-3 py-1.5 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">Time scrolling:</span>{' '}
            <span className="text-white font-medium">{formatDuration(timeElapsed)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleTakeBreak}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition"
          >
            Take a Break
          </button>
          <button
            onClick={onDismiss}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Keep Scrolling
          </button>
        </div>
      </div>
    </div>
  );
}
