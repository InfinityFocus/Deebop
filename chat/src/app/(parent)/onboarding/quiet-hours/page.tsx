'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Moon, Clock } from 'lucide-react';
import { OnboardingProgress } from '@/components/parent/onboarding/OnboardingProgress';

function QuietHoursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId');

  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState('21:00');
  const [endTime, setEndTime] = useState('07:00');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!childId) {
      router.push('/onboarding/complete');
      return;
    }

    setIsLoading(true);

    try {
      if (enabled) {
        await fetch(`/api/parent/children/${childId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quietHoursStart: startTime,
            quietHoursEnd: endTime,
          }),
        });
      }

      router.push(`/onboarding/complete?childId=${childId}`);
    } catch {
      router.push(`/onboarding/complete?childId=${childId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push(`/onboarding/complete${childId ? `?childId=${childId}` : ''}`);
  };

  return (
    <div>
      <OnboardingProgress currentStep={5} />

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Moon size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Quiet hours
            </h1>
            <p className="text-sm text-gray-400">Optional</p>
          </div>
        </div>

        <p className="text-gray-400 mb-6">
          Choose times when messaging is paused, like during school or bedtime.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gray-400" />
            <span className="text-white font-medium">Enable quiet hours</span>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              enabled ? 'bg-primary-500' : 'bg-dark-600'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Time pickers */}
        {enabled && (
          <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input text-center"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              During quiet hours, your child won&apos;t be able to send or receive messages.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="btn btn-primary w-full py-3"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : enabled ? (
              'Continue'
            ) : (
              'Continue without quiet hours'
            )}
          </button>

          {!enabled && (
            <button
              onClick={handleSkip}
              className="btn btn-ghost w-full"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingQuietHoursPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <QuietHoursContent />
    </Suspense>
  );
}
