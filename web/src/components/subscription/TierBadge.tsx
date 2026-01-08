'use client';

import { Crown, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface TierBadgeProps {
  tier: 'free' | 'standard' | 'pro';
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

  const Icon = tier === 'pro' ? Crown : Zap;
  const s = sizes[size];

  return (
    <div className="flex items-center gap-1">
      <div
        className={clsx(
          s.badge,
          'rounded-full flex items-center justify-center',
          tier === 'pro'
            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            : 'bg-blue-500'
        )}
      >
        <Icon size={s.icon} className="text-white" />
      </div>
      {showLabel && (
        <span
          className={clsx(
            s.label,
            'font-medium capitalize',
            tier === 'pro' ? 'text-emerald-400' : 'text-blue-400'
          )}
        >
          {tier}
        </span>
      )}
    </div>
  );
}
