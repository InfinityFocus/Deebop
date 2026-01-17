'use client';

import { Gift, Info } from 'lucide-react';
import { REFERRAL_CONFIG } from '@/types';

interface CreditsDisplayProps {
  creditsAvailable: number;
  yearlyCreditsUsed: number;
}

export function CreditsDisplay({
  creditsAvailable,
  yearlyCreditsUsed,
}: CreditsDisplayProps) {
  const remaining = REFERRAL_CONFIG.MAX_CREDITS_PER_YEAR - yearlyCreditsUsed;

  return (
    <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl p-4 border border-primary-500/20">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-500/20 rounded-lg">
          <Gift className="w-5 h-5 text-primary-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {creditsAvailable}
            </span>
            <span className="text-gray-400">
              {creditsAvailable === 1 ? 'free month' : 'free months'} available
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
            <Info className="w-3.5 h-3.5" />
            <span>
              {remaining} of {REFERRAL_CONFIG.MAX_CREDITS_PER_YEAR} referral rewards remaining this year
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
