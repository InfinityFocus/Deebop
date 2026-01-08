'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Zap, X, Loader2, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import type { SubscriptionTier } from '@/lib/stripe';

interface UpgradePromptProps {
  feature: string;
  requiredTier: SubscriptionTier;
  onClose?: () => void;
  variant?: 'modal' | 'inline' | 'banner';
}

const TIER_INFO = {
  standard: {
    name: 'Standard',
    price: '£5.99/month',
    icon: Zap,
    color: 'blue',
    features: [
      '10MB image uploads',
      '1 minute videos @ 1080p',
      'Profile link',
      'Reduced ads',
    ],
  },
  pro: {
    name: 'Pro',
    price: '£14.99/month',
    icon: Crown,
    color: 'emerald',
    features: [
      '50MB image uploads',
      '5 minute videos @ 4K',
      '360 Panorama uploads',
      'No ads',
      'Priority support',
    ],
  },
};

export function UpgradePrompt({
  feature,
  requiredTier,
  onClose,
  variant = 'modal',
}: UpgradePromptProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const tierInfo = TIER_INFO[requiredTier as keyof typeof TIER_INFO];
  const Icon = tierInfo?.icon || Crown;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: requiredTier }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        router.push('/settings/subscription');
      }
    } catch (error) {
      router.push('/settings/subscription');
    }
  };

  const handleViewPlans = () => {
    router.push('/settings/subscription');
    onClose?.();
  };

  // Banner variant - simple inline banner
  if (variant === 'banner') {
    return (
      <div
        className={clsx(
          'flex items-center justify-between p-4 rounded-lg',
          requiredTier === 'pro'
            ? 'bg-emerald-500/20 border border-emerald-500/50'
            : 'bg-blue-500/20 border border-blue-500/50'
        )}
      >
        <div className="flex items-center gap-3">
          <Lock size={20} className={requiredTier === 'pro' ? 'text-emerald-400' : 'text-blue-400'} />
          <p className="text-white">
            <span className="font-medium">{feature}</span> requires{' '}
            <span className={requiredTier === 'pro' ? 'text-emerald-400' : 'text-blue-400'}>
              {tierInfo?.name}
            </span>{' '}
            plan
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
            requiredTier === 'pro'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
          Upgrade
        </button>
      </div>
    );
  }

  // Inline variant - compact card
  if (variant === 'inline') {
    return (
      <div
        className={clsx(
          'p-6 rounded-xl text-center',
          requiredTier === 'pro'
            ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30'
            : 'bg-blue-500/20 border border-blue-500/30'
        )}
      >
        <div
          className={clsx(
            'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4',
            requiredTier === 'pro'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              : 'bg-blue-500'
          )}
        >
          <Icon size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Upgrade to {tierInfo?.name}</h3>
        <p className="text-gray-400 mb-4">
          {feature} is available with {tierInfo?.name} plan
        </p>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={clsx(
            'w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2',
            requiredTier === 'pro'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              Upgrade for {tierInfo?.price}
            </>
          )}
        </button>
        <button
          onClick={handleViewPlans}
          className="mt-3 text-sm text-gray-400 hover:text-white transition"
        >
          View all plans
        </button>
      </div>
    );
  }

  // Modal variant - full featured modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition z-10"
          >
            <X size={20} />
          </button>
        )}

        {/* Header with gradient */}
        <div
          className={clsx(
            'p-8 text-center',
            requiredTier === 'pro'
              ? 'bg-gradient-to-br from-emerald-600 to-cyan-600'
              : 'bg-gradient-to-br from-blue-600 to-cyan-600'
          )}
        >
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
            <Icon size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Unlock {feature}
          </h2>
          <p className="text-white/80">
            Upgrade to {tierInfo?.name} to access this feature
          </p>
        </div>

        {/* Features list */}
        <div className="p-6">
          <p className="text-gray-400 text-sm mb-4">
            {tierInfo?.name} includes:
          </p>
          <ul className="space-y-3 mb-6">
            {tierInfo?.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white">
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    requiredTier === 'pro' ? 'bg-emerald-500' : 'bg-blue-500'
                  )}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* Price and CTA */}
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-white">{tierInfo?.price}</span>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className={clsx(
              'w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2',
              requiredTier === 'pro'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            )}
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Icon size={20} />
                Upgrade to {tierInfo?.name}
              </>
            )}
          </button>

          <button
            onClick={handleViewPlans}
            className="w-full mt-3 py-2 text-gray-400 hover:text-white transition"
          >
            Compare all plans
          </button>
        </div>
      </div>
    </div>
  );
}
