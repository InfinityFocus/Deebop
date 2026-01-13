'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff, Users, Shield, Loader2, Repeat, AtSign, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';

interface PrivacySettings {
  is_private: boolean;
  show_activity_status: boolean;
  allow_tagging: boolean;
  require_tagging_approval: boolean;
  allow_mentions: boolean;
  require_mention_approval: boolean;
  show_liked_posts: boolean;
  allow_reposts: boolean;
  require_repost_approval: boolean;
}

async function fetchPrivacySettings(): Promise<PrivacySettings> {
  const res = await fetch('/api/users/me');
  if (!res.ok) throw new Error('Failed to fetch privacy settings');
  const data = await res.json();
  return {
    is_private: data.user.is_private ?? false,
    show_activity_status: data.user.show_activity_status ?? true,
    allow_tagging: data.user.allow_tagging ?? true,
    require_tagging_approval: data.user.require_tagging_approval ?? false,
    allow_mentions: data.user.allow_mentions ?? true,
    require_mention_approval: data.user.require_mention_approval ?? false,
    show_liked_posts: data.user.show_liked_posts ?? false,
    allow_reposts: data.user.allow_reposts ?? true,
    require_repost_approval: data.user.require_repost_approval ?? false,
  };
}

export default function PrivacySettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Local state for form
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [requireTaggingApproval, setRequireTaggingApproval] = useState(false);
  const [allowMentions, setAllowMentions] = useState(true);
  const [requireMentionApproval, setRequireMentionApproval] = useState(false);
  const [showLikedPosts, setShowLikedPosts] = useState(false);
  const [allowReposts, setAllowReposts] = useState(true);
  const [requireRepostApproval, setRequireRepostApproval] = useState(false);

  // Fetch user's saved privacy settings
  const { data, isLoading: settingsLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: fetchPrivacySettings,
    enabled: !!user,
    staleTime: 60000,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setIsPrivate(data.is_private);
      setShowActivityStatus(data.show_activity_status);
      setAllowTagging(data.allow_tagging);
      setRequireTaggingApproval(data.require_tagging_approval);
      setAllowMentions(data.allow_mentions);
      setRequireMentionApproval(data.require_mention_approval);
      setShowLikedPosts(data.show_liked_posts);
      setAllowReposts(data.allow_reposts);
      setRequireRepostApproval(data.require_repost_approval);
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (settings: Partial<PrivacySettings>) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save privacy settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      refreshUser?.();
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      is_private: isPrivate,
      show_activity_status: showActivityStatus,
      allow_tagging: allowTagging,
      require_tagging_approval: requireTaggingApproval,
      allow_mentions: allowMentions,
      require_mention_approval: requireMentionApproval,
      show_liked_posts: showLikedPosts,
      allow_reposts: allowReposts,
      require_repost_approval: requireRepostApproval,
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
          <Lock size={20} className="text-purple-400" />
          <h1 className="text-xl font-bold">Privacy</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account Privacy */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Account Privacy
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  {isPrivate ? (
                    <Lock size={20} className="text-purple-400" />
                  ) : (
                    <Users size={20} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">Private Account</p>
                  <p className="text-sm text-gray-300">
                    {isPrivate
                      ? 'Only approved followers can see your posts'
                      : 'Anyone can see your posts'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  isPrivate ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    isPrivate ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Reposts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Reposts
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <Repeat size={20} className={allowReposts ? 'text-emerald-400' : 'text-gray-300'} />
                </div>
                <div>
                  <p className="font-medium text-white">Allow Reposts</p>
                  <p className="text-sm text-gray-300">
                    Let others repost your public content
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAllowReposts(!allowReposts)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  allowReposts ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    allowReposts ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            {allowReposts && (
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <Shield size={20} className={requireRepostApproval ? 'text-yellow-400' : 'text-gray-300'} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Require Approval</p>
                    <p className="text-sm text-gray-300">
                      Review and approve repost requests before they appear
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRequireRepostApproval(!requireRepostApproval)}
                  className={clsx(
                    'relative w-12 h-6 rounded-full transition-colors',
                    requireRepostApproval ? 'bg-purple-500' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      requireRepostApproval ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Activity */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  {showActivityStatus ? (
                    <Eye size={20} className="text-gray-300" />
                  ) : (
                    <EyeOff size={20} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">Show Activity Status</p>
                  <p className="text-sm text-gray-300">
                    Let others see when you were last active
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActivityStatus(!showActivityStatus)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  showActivityStatus ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    showActivityStatus ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <Shield size={20} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-white">Show Liked Posts</p>
                  <p className="text-sm text-gray-300">
                    Allow others to see posts you've liked
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLikedPosts(!showLikedPosts)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  showLikedPosts ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    showLikedPosts ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Photo & Video Tags */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Photo & Video Tags
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <ImageIcon size={20} className={allowTagging ? 'text-emerald-400' : 'text-gray-300'} />
                </div>
                <div>
                  <p className="font-medium text-white">Allow Tagging</p>
                  <p className="text-sm text-gray-300">
                    Let others tag you in photos, videos, and panoramas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAllowTagging(!allowTagging)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  allowTagging ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    allowTagging ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            {allowTagging && (
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <Shield size={20} className={requireTaggingApproval ? 'text-yellow-400' : 'text-gray-300'} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Require Approval</p>
                    <p className="text-sm text-gray-300">
                      Review and approve tags before they appear on your profile
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRequireTaggingApproval(!requireTaggingApproval)}
                  className={clsx(
                    'relative w-12 h-6 rounded-full transition-colors',
                    requireTaggingApproval ? 'bg-purple-500' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      requireTaggingApproval ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Mentions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Mentions
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <AtSign size={20} className={allowMentions ? 'text-emerald-400' : 'text-gray-300'} />
                </div>
                <div>
                  <p className="font-medium text-white">Allow Mentions</p>
                  <p className="text-sm text-gray-300">
                    Let others mention you (@username) in their posts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAllowMentions(!allowMentions)}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  allowMentions ? 'bg-purple-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    allowMentions ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            {allowMentions && (
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <Shield size={20} className={requireMentionApproval ? 'text-yellow-400' : 'text-gray-300'} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Require Approval</p>
                    <p className="text-sm text-gray-300">
                      Review and approve mentions before others can see them
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRequireMentionApproval(!requireMentionApproval)}
                  className={clsx(
                    'relative w-12 h-6 rounded-full transition-colors',
                    requireMentionApproval ? 'bg-purple-500' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      requireMentionApproval ? 'right-1' : 'left-1'
                    )}
                  />
                </button>
              </div>
            )}
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
