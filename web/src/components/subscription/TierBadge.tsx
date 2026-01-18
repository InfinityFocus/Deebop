'use client';

import { Crown, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface TierBadgeProps {
  tier: 'free' | 'creator' | 'pro' | 'teams';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TierBadge({ tier, size = 'md', showLabel = false }: TierBadgeProps) {
  if (tier === 'free') return null;

  const sizes = {
    sm: { badge: 'w-4 h-4', icon: 8, label: 'text-xs' },
    md: { badge: 'w-5 h-5', icon: 10, label: 'text-sm' },
    lg: { badge: 'w-6 h-6', icon: 12, label: 'text-base' },
  };

  const Icon = tier === 'pro' || tier === 'teams' ? Crown : Zap;
  const s = sizes[size];

  const bgColor = tier === 'teams'
    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
    : tier === 'pro'
      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
      : 'bg-blue-500';

  const textColor = tier === 'teams'
    ? 'text-purple-400'
    : tier === 'pro'
      ? 'text-emerald-400'
      : 'text-blue-400';

  return (
    <div className="flex items-center gap-1">
      <div
        className={clsx(
          s.badge,
          'rounded-full flex items-center justify-center',
          bgColor
        )}
      >
        <Icon size={s.icon} className="text-white" />
      </div>
      {showLabel && (
        <span className={clsx(s.label, 'font-medium capitalize', textColor)}>
          {tier}
        </span>
      )}
    </div>
  );
}
