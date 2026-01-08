'use client';

import { useState } from 'react';
import { X, Loader2, Rocket, TrendingUp, Globe } from 'lucide-react';
import { clsx } from 'clsx';

interface BoostPostModalProps {
  postId: string;
  onClose: () => void;
}

const BUDGET_OPTIONS = [
  { value: 5, label: '£5', reach: '~500 people' },
  { value: 10, label: '£10', reach: '~1,000 people' },
  { value: 25, label: '£25', reach: '~2,500 people' },
  { value: 50, label: '£50', reach: '~5,000 people' },
  { value: 100, label: '£100', reach: '~10,000 people' },
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: null, label: 'Until budget runs out' },
];

export function BoostPostModal({ postId, onClose }: BoostPostModalProps) {
  const [budget, setBudget] = useState(10);
  const [duration, setDuration] = useState<number | null>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBoost = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          budgetPounds: budget,
          durationDays: duration,
          targetCountries: [], // Could add country targeting UI
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create boost');
      }

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create boost');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boost-modal-title"
    >
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <h2 id="boost-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
            <Rocket size={24} className="text-purple-400" aria-hidden="true" />
            Boost Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close boost modal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Budget Selection */}
          <div>
            <label id="budget-label" className="block text-sm font-medium text-gray-300 mb-3">
              Budget
            </label>
            <div
              className="grid grid-cols-3 sm:grid-cols-5 gap-2"
              role="radiogroup"
              aria-labelledby="budget-label"
            >
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={clsx(
                    'py-3 px-3 rounded-lg text-center transition min-h-[44px] touch-manipulation',
                    budget === option.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                  role="radio"
                  aria-checked={budget === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp size={14} />
              Estimated reach: {BUDGET_OPTIONS.find((o) => o.value === budget)?.reach}
            </p>
          </div>

          {/* Duration Selection */}
          <div>
            <label id="duration-label" className="block text-sm font-medium text-gray-300 mb-3">
              Duration
            </label>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              role="radiogroup"
              aria-labelledby="duration-label"
            >
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value ?? 'unlimited'}
                  onClick={() => setDuration(option.value)}
                  className={clsx(
                    'py-3 px-3 rounded-lg text-center text-sm transition min-h-[44px] touch-manipulation',
                    duration === option.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                  role="radio"
                  aria-checked={duration === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Targeting Info */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
              <Globe size={16} />
              Targeting
            </h3>
            <p className="text-sm text-gray-400">
              Your boosted post will be shown to users worldwide. Advanced targeting coming soon.
            </p>
          </div>

          {/* Summary */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Cost</span>
              <span className="text-2xl font-bold text-white">£{budget}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Charged at 5p per click. Unused budget is not refundable.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Rocket size={20} />
                Boost for £{budget}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
