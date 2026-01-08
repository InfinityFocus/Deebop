'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Bell, Heart, UserPlus, Share2, AtSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';

interface NotificationSettings {
  notifyLikes: boolean;
  notifyFollowers: boolean;
  notifyShares: boolean;
  notifyMentions: boolean;
  emailWeeklyDigest: boolean;
  emailProductUpdates: boolean;
}

async function fetchNotifications(): Promise<NotificationSettings> {
  const res = await fetch('/api/users/me/notifications');
  if (!res.ok) throw new Error('Failed to fetch notification settings');
  return res.json();
}

export default function NotificationsSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Local state for form
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [notifyShares, setNotifyShares] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [emailProductUpdates, setEmailProductUpdates] = useState(true);

  // Fetch user's saved notification settings
  const { data, isLoading: settingsLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: fetchNotifications,
    enabled: !!user,
    staleTime: 60000,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setNotifyLikes(data.notifyLikes ?? true);
      setNotifyFollowers(data.notifyFollowers ?? true);
      setNotifyShares(data.notifyShares ?? true);
      setNotifyMentions(data.notifyMentions ?? true);
      setEmailWeeklyDigest(data.emailWeeklyDigest ?? false);
      setEmailProductUpdates(data.emailProductUpdates ?? true);
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const res = await fetch('/api/users/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save notification settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      notifyLikes,
      notifyFollowers,
      notifyShares,
      notifyMentions,
      emailWeeklyDigest,
      emailProductUpdates,
    });
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pushSettings = [
    {
      id: 'likes',
      icon: Heart,
      label: 'Likes',
      description: 'When someone likes your post',
      enabled: notifyLikes,
      toggle: () => setNotifyLikes(!notifyLikes),
    },
    {
      id: 'follows',
      icon: UserPlus,
      label: 'New Followers',
      description: 'When someone follows you',
      enabled: notifyFollowers,
      toggle: () => setNotifyFollowers(!notifyFollowers),
    },
    {
      id: 'shares',
      icon: Share2,
      label: 'Shares',
      description: 'When someone shares your post',
      enabled: notifyShares,
      toggle: () => setNotifyShares(!notifyShares),
    },
    {
      id: 'mentions',
      icon: AtSign,
      label: 'Mentions',
      description: 'When someone mentions you in a post',
      enabled: notifyMentions,
      toggle: () => setNotifyMentions(!notifyMentions),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-purple-400" />
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Push Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Push Notifications
          </h2>
          <div className="space-y-3">
            {pushSettings.map(setting => {
              const Icon = setting.icon;
              return (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <Icon size={20} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{setting.label}</p>
                      <p className="text-sm text-gray-300">{setting.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={setting.toggle}
                    className={clsx(
                      'relative w-12 h-6 rounded-full transition-colors',
                      setting.enabled ? 'bg-purple-500' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        setting.enabled ? 'right-1' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Email Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Email Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div>
                <p className="font-medium text-white">Weekly Digest</p>
                <p className="text-sm text-gray-300">
                  Get a summary of your activity and popular posts
                </p>
              </div>
              <button
                onClick={() => setEmailWeeklyDigest(!emailWeeklyDigest)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  emailWeeklyDigest ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    emailWeeklyDigest ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div>
                <p className="font-medium text-white">Product Updates</p>
                <p className="text-sm text-gray-300">
                  News about new features and improvements
                </p>
              </div>
              <button
                onClick={() => setEmailProductUpdates(!emailProductUpdates)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  emailProductUpdates ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    emailProductUpdates ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : saveMutation.isSuccess ? (
            'Saved!'
          ) : (
            'Save Changes'
          )}
        </button>

        {saveMutation.isError && (
          <p className="text-sm text-red-400 text-center">
            Failed to save settings. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
