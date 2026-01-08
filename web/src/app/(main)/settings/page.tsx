'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard,
  User,
  Bell,
  Lock,
  Palette,
  Heart,
  ChevronRight,
  Crown,
  Zap,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface SettingsItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  highlight?: boolean;
  disabled?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

const settingsGroups: SettingsGroup[] = [
  {
    title: 'Account',
    items: [
      {
        href: '/profile/edit',
        icon: User,
        label: 'Edit Profile',
        description: 'Update your display name, bio, and avatar',
      },
      {
        href: '/settings/subscription',
        icon: CreditCard,
        label: 'Subscription',
        description: 'Manage your plan and billing',
        highlight: true,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        href: '/settings/notifications',
        icon: Bell,
        label: 'Notifications',
        description: 'Configure notification preferences',
      },
      {
        href: '/settings/privacy',
        icon: Lock,
        label: 'Privacy',
        description: 'Control who can see your content',
      },
      {
        href: '/settings/appearance',
        icon: Palette,
        label: 'Appearance',
        description: 'Customize your experience',
      },
      {
        href: '/settings/wellbeing',
        icon: Heart,
        label: 'Wellbeing',
        description: 'Manage doom scroll reminders',
      },
    ],
  },
];

const tierIcons = {
  free: Sparkles,
  standard: Zap,
  pro: Crown,
};

const tierColors = {
  free: 'text-gray-400',
  standard: 'text-blue-400',
  pro: 'text-purple-400',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const TierIcon = tierIcons[user?.tier || 'free'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-gray-300 mb-8">Manage your account and preferences</p>

      {/* Current Plan Banner */}
      {user && (
        <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  user.tier === 'pro'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : user.tier === 'standard'
                    ? 'bg-blue-500'
                    : 'bg-gray-600'
                )}
              >
                <TierIcon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {user.tier === 'pro'
                    ? 'Pro'
                    : user.tier === 'standard'
                    ? 'Standard'
                    : 'Free'}{' '}
                  Plan
                </p>
                <p className="text-sm text-gray-300">
                  {user.tier === 'free'
                    ? 'Upgrade to unlock more features'
                    : 'Thanks for supporting Deebop!'}
                </p>
              </div>
            </div>
            <Link
              href="/settings/subscription"
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition',
                user.tier === 'free'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              )}
            >
              {user.tier === 'free' ? 'Upgrade' : 'Manage'}
            </Link>
          </div>
        </div>
      )}

      {/* Settings Groups */}
      <div className="space-y-8">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const Component = item.disabled ? 'div' : Link;

                return (
                  <Component
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl border transition',
                      item.disabled
                        ? 'bg-gray-800/30 border-gray-800 cursor-not-allowed opacity-50'
                        : item.highlight
                        ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        item.highlight ? 'bg-purple-500/20' : 'bg-gray-700'
                      )}
                    >
                      <Icon
                        size={20}
                        className={item.highlight ? 'text-purple-400' : 'text-gray-300'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          'font-medium',
                          item.highlight ? 'text-purple-400' : 'text-white'
                        )}
                      >
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-300 truncate">{item.description}</p>
                    </div>
                    {!item.disabled && (
                      <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
                    )}
                    {item.disabled && (
                      <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                        Soon
                      </span>
                    )}
                  </Component>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
