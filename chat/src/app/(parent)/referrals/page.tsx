'use client';

import { useEffect, useState } from 'react';
import { Gift, Info, Loader2 } from 'lucide-react';
import {
  ReferralStats,
  ReferralList,
  PersonalizedInviteForm,
  CreditsDisplay,
  ShareOptions,
} from '@/components/parent/referrals';
import type { ParentReferralSummary } from '@/types';

export default function ReferralsPage() {
  const [data, setData] = useState<ParentReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  async function fetchReferrals() {
    try {
      const res = await fetch('/api/parent/referrals');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load referrals');
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateInvite(childNames: string[]) {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/parent/referrals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childNames }),
      });
      const result = await res.json();

      if (result.success) {
        setGeneratedUrl(result.data.referralUrl);
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(result.data.referralUrl);
        } catch (e) {
          // Clipboard access not available
        }
      } else {
        setError(result.error || 'Failed to generate invite');
      }
    } catch (err) {
      console.error('Failed to generate invite:', err);
      setError('Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading referrals...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-500/10 text-red-400 rounded-xl p-4 text-center">
          {error || 'Failed to load referrals. Please try again.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary-400" />
          Invite a family
        </h1>
        <p className="text-gray-400">
          When a family you invite subscribes and completes their first paid month, you&apos;ll get 1 month free.
        </p>
      </div>

      {/* Credits Display */}
      <CreditsDisplay
        creditsAvailable={data.creditsAvailable}
        yearlyCreditsUsed={data.yearlyCreditsUsed}
      />

      {/* Stats */}
      <ReferralStats stats={data.stats} />

      {/* Share Section */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Share your invite</h2>
        <ShareOptions referralUrl={data.referralUrl} code={data.code} />
      </div>

      {/* Personalized Invite */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Personalized invite</h2>
        <p className="text-sm text-gray-400 mb-4">
          Add your child&apos;s name(s) for a personal touch
        </p>

        {generatedUrl ? (
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Your personalized link:</div>
              <div className="text-white text-sm break-all font-mono">
                {generatedUrl}
              </div>
              <div className="text-xs text-green-400 mt-2">Copied to clipboard!</div>
            </div>
            <button
              onClick={() => setGeneratedUrl(null)}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Create another link
            </button>
          </div>
        ) : (
          <PersonalizedInviteForm
            code={data.code}
            onGenerate={handleGenerateInvite}
            isLoading={isGenerating}
          />
        )}
      </div>

      {/* Referral List */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Your referrals</h2>
        <ReferralList referrals={data.referrals} />
      </div>

      {/* Small Print */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Rewards apply to your next renewal. Limit 12 free months per year.
          The family you invite does not receive any reward—this is transparent
          in the invite message they see.
        </p>
      </div>
    </div>
  );
}
