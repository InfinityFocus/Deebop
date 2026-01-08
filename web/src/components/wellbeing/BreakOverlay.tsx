'use client';

import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { useDoomScrollStore } from '@/stores/doomScrollStore';

interface BreakOverlayProps {
  onBreakEnd?: () => void;
}

export function BreakOverlay({ onBreakEnd }: BreakOverlayProps) {
  const { isBreakActive, getBreakTimeRemaining, endBreak } = useDoomScrollStore();
  const [timeRemaining, setTimeRemaining] = useState(getBreakTimeRemaining());
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getBreakTimeRemaining();
      setTimeRemaining(remaining);

      // Auto-end break when time expires
      if (remaining <= 0 && isBreakActive()) {
        endBreak();
        onBreakEnd?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getBreakTimeRemaining, isBreakActive, endBreak, onBreakEnd]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndBreakClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmEndBreak = () => {
    endBreak();
    setShowConfirmation(false);
    onBreakEnd?.();
  };

  const handleContinueBreak = () => {
    setShowConfirmation(false);
  };

  if (!isBreakActive()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/50">
      {/* Main break card */}
      {!showConfirmation && (
        <div className="max-w-md w-full mx-4 p-8 bg-gray-900/90 border border-amber-500/30 rounded-2xl text-center">
          {/* Coffee icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Coffee className="w-10 h-10 text-amber-400" />
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-amber-400 mb-2">Taking a break...</h2>

          {/* Countdown */}
          <div className="mb-6">
            <p className="text-gray-400 mb-2">Time remaining</p>
            <p className="text-4xl font-mono font-bold text-white">{formatTime(timeRemaining)}</p>
          </div>

          {/* Suggestion */}
          <p className="text-gray-400 mb-8 leading-relaxed">
            Grab some water, stretch, or step outside.
          </p>

          {/* End break early link */}
          <button
            onClick={handleEndBreakClick}
            className="text-sm text-gray-500 hover:text-gray-300 transition"
          >
            end break early &rarr;
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="max-w-sm w-full mx-4 p-6 bg-gray-900/95 border border-gray-700 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-white mb-2">End break early?</h3>
          <p className="text-gray-400 mb-6">Continue scrolling now?</p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleContinueBreak}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition"
            >
              Continue break
            </button>
            <button
              onClick={handleConfirmEndBreak}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              End break
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
