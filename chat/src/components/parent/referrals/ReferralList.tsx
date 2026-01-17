'use client';

import { Referral, REFERRAL_STATUS_LABELS, ReferralStatus } from '@/types';
import { CheckCircle2, Clock, UserPlus, CreditCard, Gift } from 'lucide-react';

interface ReferralListProps {
  referrals: Referral[];
}

function getStatusIcon(status: ReferralStatus) {
  switch (status) {
    case 'clicked':
      return Clock;
    case 'signed_up':
      return UserPlus;
    case 'subscribed':
      return CreditCard;
    case 'eligible':
      return Clock;
    case 'credited':
      return Gift;
    default:
      return Clock;
  }
}

function getStatusColor(status: ReferralStatus) {
  switch (status) {
    case 'clicked':
      return 'text-gray-400 bg-gray-500/10';
    case 'signed_up':
      return 'text-blue-400 bg-blue-500/10';
    case 'subscribed':
      return 'text-purple-400 bg-purple-500/10';
    case 'eligible':
      return 'text-amber-400 bg-amber-500/10';
    case 'credited':
      return 'text-emerald-400 bg-emerald-500/10';
    default:
      return 'text-gray-400 bg-gray-500/10';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function ReferralList({ referrals }: ReferralListProps) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No referrals yet. Share your link to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {referrals.map((referral) => {
        const StatusIcon = getStatusIcon(referral.status);
        const statusColors = getStatusColor(referral.status);
        const displayName = referral.childNames?.length
          ? referral.childNames.join(', ')
          : referral.refereeEmail?.split('@')[0] || 'Invite';

        return (
          <div
            key={referral.id}
            className="flex items-center justify-between p-3 bg-dark-800 rounded-xl border border-dark-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusColors}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-medium">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(referral.createdAt)}
                </div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors}`}>
              {REFERRAL_STATUS_LABELS[referral.status]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
