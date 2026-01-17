'use client';

import { MousePointer, UserPlus, CreditCard, Gift } from 'lucide-react';

interface ReferralStatsProps {
  stats: {
    clicks: number;
    signups: number;
    subscriptions: number;
    credited: number;
  };
}

export function ReferralStats({ stats }: ReferralStatsProps) {
  const statItems = [
    {
      label: 'Invites sent',
      value: stats.clicks,
      icon: MousePointer,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Signed up',
      value: stats.signups,
      icon: UserPlus,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Subscribed',
      value: stats.subscriptions,
      icon: CreditCard,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Months earned',
      value: stats.credited,
      icon: Gift,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-dark-800 rounded-xl p-4 border border-dark-700"
        >
          <div className={`inline-flex p-2 rounded-lg ${item.bgColor} mb-2`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </div>
          <div className="text-2xl font-bold text-white">{item.value}</div>
          <div className="text-sm text-gray-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
