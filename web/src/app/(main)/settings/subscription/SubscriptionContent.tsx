'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Crown, Zap, Sparkles, Loader2, ExternalLink
 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionStatus {
  tier: 'free' | 'standard' | 'pro';
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    icon: Sparkles,
    features: [
      'Images up to 500KB (compressed)',
      'Videos up to 30s @ 720p',
      'Audio up to 1min',
      'Unlimited shouts',
      'Collaborative Albums',
      'Scheduled Drops',
      'Audience Groups',
      'Events',
      'Provenance Labels',
      'Post Boosts',
      'Full ads',
    ],
    notIncluded: [
      '360 Panoramas',
      'Profile link',
      'Creator Page',
    ],
  },
  standard: {
    name: 'Standard',
    price: 599,
    description: 'For content creators',
    icon: Zap,
    features: [
      'Images up to 10MB (original quality)',
      'Videos up to 1min @ 1080p',
      'Audio up to 5min',
      'Unlimited shouts',
      'Collaborative Albums',
      'Scheduled Drops',
      'Audience Groups',
      'Events',
      'Provenance Labels',
      'Post Boosts',
      'Creator Page (10 blocks, 20 links)',
      'Profile link',
      'Reduced ads',
    ],
    notIncluded: [
      '360 Panoramas',
      'Priority Post Boosts',
      'Advanced Creator Page',
      'No ads',
    ],
  },
  pro: {
    name: 'Pro',
    price: 1499,
    description: 'For professionals',
    icon: Crown,
    popular: true,
    features: [
      'Images up to 50MB (original quality)',
      'Videos up to 5min @ 4K',
      'Audio up to 30min',
      'Unlimited shouts',
      'Collaborative Albums',
      'Scheduled Drops',
      'Audience Groups',
      'Events',
      'Provenance Labels',
      'Priority Post Boosts',
      '360 Panoramas (100MB)',
      'Creator Page (30 blocks, 100 links, custom themes)',
      'Profile link',
      'No ads',
      'Priority support',
    ],
    notIncluded: [],
  },
};

export function SubscriptionContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    fetchStatus();
    if (success) {
      refreshUser?.();
    }
  }, [success]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/subscriptions/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (tier: 'standard' | 'pro') => {
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to open portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open subscription portal');
    }
  };

  const formatPrice = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(pence / 100);
  };

  const currentTier = status?.tier || user?.tier || 'free';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
          Subscription activated successfully! Welcome to {currentTier === 'pro' ? 'Pro' : 'Standard'}.
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h1>
        <p className="text-gray-300">
          Unlock more features and grow your audience
        </p>
      </div>

      {/* Current Subscription Status */}
      {status?.subscription && (
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                Current Plan: <span className="text-purple-400 capitalize">{currentTier}</span>
              </p>
              <p className="text-sm text-gray-300">
                {status.subscription.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Manage Subscription
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {(Object.entries(TIERS) as [keyof typeof TIERS, typeof TIERS[keyof typeof TIERS]][]).map(
          ([tierKey, tier]) => {
            const Icon = tier.icon;
            const isCurrentTier = currentTier === tierKey;
            const isPopular = 'popular' in tier && tier.popular;

            return (
              <div
                key={tierKey}
                className={clsx(
                  'relative rounded-2xl border p-6 transition',
                  isPopular
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50',
                  isCurrentTier && 'ring-2 ring-purple-500'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div
                    className={clsx(
                      'w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3',
                      tierKey === 'pro'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : tierKey === 'standard'
                        ? 'bg-blue-500'
                        : 'bg-gray-600'
                    )}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{tier.name}</h2>
                  <p className="text-sm text-gray-300">{tier.description}</p>
                  <div className="mt-4">
                    {tier.price === 0 ? (
                      <span className="text-3xl font-bold text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white">
                          {formatPrice(tier.price)}
                        </span>
                        <span className="text-gray-400">/month</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        size={18}
                        className="text-green-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                  {tier.notIncluded.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 opacity-50"
                    >
                      <span className="w-[18px] h-[18px] flex items-center justify-center text-gray-500">
                        -
                      </span>
                      <span className="text-gray-500 text-sm line-through">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {tierKey === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg cursor-not-allowed"
                  >
                    {isCurrentTier ? 'Current Plan' : 'Default Plan'}
                  </button>
                ) : isCurrentTier ? (
                  <button
                    onClick={handleManageSubscription}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Manage Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(tierKey as 'standard' | 'pro')}
                    disabled={checkoutLoading !== null}
                    className={clsx(
                      'w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2',
                      isPopular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-white hover:bg-gray-100 text-black'
                    )}
                  >
                    {checkoutLoading === tierKey ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        {currentTier === 'free' ? 'Upgrade' : 'Switch'} to {tier.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* FAQ */}
      <div className="mt-12 text-center text-gray-400">
        <p className="text-sm">
          All plans include core features. Subscriptions can be canceled anytime.
        </p>
        <p className="text-sm mt-2">
          Questions? Contact us at{' '}
          <a href="mailto:support@deebop.com" className="text-purple-400 hover:underline">
            support@deebop.com
          </a>
        </p>
      </div>
    </div>
  );
}
