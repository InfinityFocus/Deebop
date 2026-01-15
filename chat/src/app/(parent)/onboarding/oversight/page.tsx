'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check, Eye, Shield, ShieldCheck } from 'lucide-react';
import { OnboardingProgress } from '@/components/parent/onboarding/OnboardingProgress';
import type { OversightMode } from '@/types';

interface OversightOption {
  value: OversightMode;
  label: string;
  description: string;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'blue';
  recommended?: boolean;
}

const OPTIONS: OversightOption[] = [
  {
    value: 'approve_first',
    label: 'Approve first message per friend',
    description: 'You approve the first message from each new friend. After that, messages flow normally.',
    icon: Shield,
    color: 'green',
    recommended: true,
  },
  {
    value: 'monitor',
    label: 'Monitor messages',
    description: 'Messages are delivered immediately. You can read them anytime.',
    icon: Eye,
    color: 'yellow',
  },
  {
    value: 'approve_all',
    label: 'Approve every message',
    description: 'Messages are held until you approve them.',
    icon: ShieldCheck,
    color: 'blue',
  },
];

function OversightContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId');

  const [selected, setSelected] = useState<OversightMode>('approve_first');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!childId) {
      router.push('/onboarding/add-child');
      return;
    }

    setIsLoading(true);

    try {
      await fetch(`/api/parent/children/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oversightMode: selected }),
      });

      router.push(`/onboarding/friends?childId=${childId}`);
    } catch {
      // Even if update fails, continue to next step
      router.push(`/onboarding/friends?childId=${childId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const colorClasses = {
    green: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/10',
      indicator: 'bg-emerald-500',
      icon: 'text-emerald-400',
    },
    yellow: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-500/10',
      indicator: 'bg-yellow-500',
      icon: 'text-yellow-400',
    },
    blue: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-500/10',
      indicator: 'bg-cyan-500',
      icon: 'text-cyan-400',
    },
  };

  return (
    <div>
      <OnboardingProgress currentStep={3} />

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          How would you like messages handled?
        </h1>
        <p className="text-gray-400 mb-6">
          Choose the level of oversight that works for your family.
        </p>

        <div className="space-y-3 mb-6">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.value;
            const colors = colorClasses[option.color];

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? `${colors.border} ${colors.bg}`
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Color indicator */}
                  <div className={`w-1 h-12 rounded-full ${colors.indicator}`} />

                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-dark-800' : 'bg-dark-700'}`}>
                    <Icon
                      size={24}
                      className={isSelected ? colors.icon : 'text-gray-500'}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {option.label}
                      </h3>
                      {option.recommended && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {option.description}
                    </p>
                  </div>

                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                    isSelected ? colors.border : 'border-dark-500'
                  }`}>
                    {isSelected && (
                      <Check size={12} className={colors.icon} />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mb-6 text-center">
          You can change this at any time, even per friend.
        </p>

        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="btn btn-primary w-full py-3"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingOversightPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <OversightContent />
    </Suspense>
  );
}
