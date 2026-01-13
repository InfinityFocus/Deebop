'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard,
  User,
  Users,
  Bell,
  Lock,
  Palette,
  Heart,
  ChevronRight,
  Crown,
  Zap,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2,
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
        href: '/settings/profiles',
        icon: Users,
        label: 'Manage Profiles',
        description: 'Switch between or add new profiles',
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const TierIcon = tierIcons[user?.tier || 'free'];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/users/me/delete', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Log out and redirect to home
      await logout();
      router.push('/');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

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

        {/* Danger Zone */}
        <div>
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            Danger Zone
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:border-red-500/50 transition text-left"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-gray-300">
                  Permanently delete your account and all data
                </p>
              </div>
              <ChevronRight size={20} className="text-red-400 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Your account and all profiles
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  All your posts, images, and videos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Your followers and following lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  All saved items and preferences
                </li>
              </ul>

              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm text-gray-300 mb-2">
                  Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-400">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
