'use client';

import { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared';
import { TIMEOUT_REASONS, type TimeoutReason, type CreateTimeoutInput } from '@/types';

interface Props {
  childId: string;
  childName: string;
  conversationId?: string; // Optional - if provided, timeout applies to specific conversation
  onClose: () => void;
  onSubmit: (input: CreateTimeoutInput) => Promise<void>;
}

const START_IN_OPTIONS = [
  { value: 0, label: 'Now' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

const DURATION_OPTIONS = [
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

export function TimeoutModal({ childId, childName, conversationId, onClose, onSubmit }: Props) {
  const [startIn, setStartIn] = useState(0);
  const [duration, setDuration] = useState(30);
  const [customStartIn, setCustomStartIn] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomStartIn, setShowCustomStartIn] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [reason, setReason] = useState<TimeoutReason | undefined>();
  const [applyToAll, setApplyToAll] = useState(!conversationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const actualStartIn = showCustomStartIn ? parseInt(customStartIn) || 0 : startIn;
    const actualDuration = showCustomDuration ? parseInt(customDuration) || 30 : duration;

    if (actualDuration < 1 || actualDuration > 480) {
      setError('Duration must be between 1 and 480 minutes');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        childId,
        conversationId: applyToAll ? undefined : conversationId,
        startIn: actualStartIn,
        duration: actualDuration,
        reason,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Wrap-up Timer</h3>
              <p className="text-sm text-gray-400">for {childName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Start In */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start in
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {START_IN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStartIn(opt.value);
                    setShowCustomStartIn(false);
                  }}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    !showCustomStartIn && startIn === opt.value
                      ? 'bg-primary-500/20 border-primary-500 text-white border-2'
                      : 'bg-dark-700 border-dark-600 text-gray-300 border hover:border-dark-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowCustomStartIn(!showCustomStartIn)}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              {showCustomStartIn ? 'Use preset' : 'Custom'}
            </button>
            {showCustomStartIn && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={customStartIn}
                  onChange={(e) => setCustomStartIn(e.target.value)}
                  placeholder="0"
                  className="w-20 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
                <span className="text-gray-400">minutes</span>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDuration(opt.value);
                    setShowCustomDuration(false);
                  }}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    !showCustomDuration && duration === opt.value
                      ? 'bg-primary-500/20 border-primary-500 text-white border-2'
                      : 'bg-dark-700 border-dark-600 text-gray-300 border hover:border-dark-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowCustomDuration(!showCustomDuration)}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              {showCustomDuration ? 'Use preset' : 'Custom'}
            </button>
            {showCustomDuration && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="30"
                  className="w-20 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
                <span className="text-gray-400">minutes (max 8 hours)</span>
              </div>
            )}
          </div>

          {/* Apply To */}
          {conversationId && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apply to
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApplyToAll(false)}
                  className={`p-3 rounded-lg text-sm transition-colors ${
                    !applyToAll
                      ? 'bg-primary-500/20 border-primary-500 text-white border-2'
                      : 'bg-dark-700 border-dark-600 text-gray-300 border hover:border-dark-500'
                  }`}
                >
                  This chat only
                </button>
                <button
                  type="button"
                  onClick={() => setApplyToAll(true)}
                  className={`p-3 rounded-lg text-sm transition-colors ${
                    applyToAll
                      ? 'bg-primary-500/20 border-primary-500 text-white border-2'
                      : 'bg-dark-700 border-dark-600 text-gray-300 border hover:border-dark-500'
                  }`}
                >
                  All chats
                </button>
              </div>
            </div>
          )}

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIMEOUT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(reason === r.value ? undefined : r.value)}
                  className={`p-3 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    reason === r.value
                      ? 'bg-primary-500/20 border-primary-500 text-white border-2'
                      : 'bg-dark-700 border-dark-600 text-gray-300 border hover:border-dark-500'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Start Timer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
