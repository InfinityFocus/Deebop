'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Lock, Eye, EyeOff, Users, Shield, Loader2, Repeat, AtSign,
  ImageIcon, Search, UserX, VolumeX, Ban, Download, Power, ChevronRight,
  X, Hash, UserMinus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';

interface PrivacySettings {
  is_private: boolean;
  show_activity_status: boolean;
  allow_tagging: boolean;
  require_tagging_approval: boolean;
  limit_tags_to_followers: boolean;
  allow_mentions: boolean;
  require_mention_approval: boolean;
  limit_mentions_to_followers: boolean;
  show_liked_posts: boolean;
  allow_reposts: boolean;
  require_repost_approval: boolean;
  hide_from_discovery: boolean;
  dont_suggest_account: boolean;
  hide_followers_list: boolean;
  hide_following_list: boolean;
  hide_engagement_counts: boolean;
}

interface BlockedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  blocked_at: string;
}

interface MutedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  muted_at: string;
}

interface RestrictedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  restricted_at: string;
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
    limit_tags_to_followers: data.user.limit_tags_to_followers ?? false,
    allow_mentions: data.user.allow_mentions ?? true,
    require_mention_approval: data.user.require_mention_approval ?? false,
    limit_mentions_to_followers: data.user.limit_mentions_to_followers ?? false,
    show_liked_posts: data.user.show_liked_posts ?? false,
    allow_reposts: data.user.allow_reposts ?? true,
    require_repost_approval: data.user.require_repost_approval ?? false,
    hide_from_discovery: data.user.hide_from_discovery ?? false,
    dont_suggest_account: data.user.dont_suggest_account ?? false,
    hide_followers_list: data.user.hide_followers_list ?? false,
    hide_following_list: data.user.hide_following_list ?? false,
    hide_engagement_counts: data.user.hide_engagement_counts ?? false,
  };
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={clsx(
        'relative w-12 h-6 rounded-full transition-colors',
        enabled ? 'bg-emerald-500' : 'bg-gray-600'
      )}
    >
      <span
        className={clsx(
          'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
          enabled ? 'right-1' : 'left-1'
        )}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  iconColor,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          <Icon size={20} className={iconColor || 'text-gray-300'} />
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

function UserListModal({
  title,
  users,
  isOpen,
  onClose,
  onRemove,
  emptyText,
}: {
  title: string;
  users: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (username: string) => void;
  emptyText: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-96 p-4">
          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-8">{emptyText}</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {user.display_name || `@${user.username}`}
                      </p>
                      {user.display_name && (
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(user.username)}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrivacySettingsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Modal states
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showMutedModal, setShowMutedModal] = useState(false);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);

  // Local state for form
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [requireTaggingApproval, setRequireTaggingApproval] = useState(false);
  const [limitTagsToFollowers, setLimitTagsToFollowers] = useState(false);
  const [allowMentions, setAllowMentions] = useState(true);
  const [requireMentionApproval, setRequireMentionApproval] = useState(false);
  const [limitMentionsToFollowers, setLimitMentionsToFollowers] = useState(false);
  const [showLikedPosts, setShowLikedPosts] = useState(false);
  const [allowReposts, setAllowReposts] = useState(true);
  const [requireRepostApproval, setRequireRepostApproval] = useState(false);
  const [hideFromDiscovery, setHideFromDiscovery] = useState(false);
  const [dontSuggestAccount, setDontSuggestAccount] = useState(false);
  const [hideFollowersList, setHideFollowersList] = useState(false);
  const [hideFollowingList, setHideFollowingList] = useState(false);
  const [hideEngagementCounts, setHideEngagementCounts] = useState(false);

  // Fetch user's saved privacy settings
  const { data, isLoading: settingsLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: fetchPrivacySettings,
    enabled: !!user,
    staleTime: 60000,
  });

  // Fetch blocked/muted/restricted users
  const { data: blockedData } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const res = await fetch('/api/users/me/blocked');
      if (!res.ok) throw new Error('Failed to fetch blocked users');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: mutedData } = useQuery({
    queryKey: ['muted-users'],
    queryFn: async () => {
      const res = await fetch('/api/users/me/muted');
      if (!res.ok) throw new Error('Failed to fetch muted users');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: restrictedData } = useQuery({
    queryKey: ['restricted-users'],
    queryFn: async () => {
      const res = await fetch('/api/users/me/restricted');
      if (!res.ok) throw new Error('Failed to fetch restricted users');
      return res.json();
    },
    enabled: !!user,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setIsPrivate(data.is_private);
      setShowActivityStatus(data.show_activity_status);
      setAllowTagging(data.allow_tagging);
      setRequireTaggingApproval(data.require_tagging_approval);
      setLimitTagsToFollowers(data.limit_tags_to_followers);
      setAllowMentions(data.allow_mentions);
      setRequireMentionApproval(data.require_mention_approval);
      setLimitMentionsToFollowers(data.limit_mentions_to_followers);
      setShowLikedPosts(data.show_liked_posts);
      setAllowReposts(data.allow_reposts);
      setRequireRepostApproval(data.require_repost_approval);
      setHideFromDiscovery(data.hide_from_discovery);
      setDontSuggestAccount(data.dont_suggest_account);
      setHideFollowersList(data.hide_followers_list);
      setHideFollowingList(data.hide_following_list);
      setHideEngagementCounts(data.hide_engagement_counts);
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

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/users/${username}/block`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unblock user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });

  // Unmute mutation
  const unmuteMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/users/${username}/mute`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unmute user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muted-users'] });
    },
  });

  // Unrestrict mutation
  const unrestrictMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`/api/users/${username}/restrict`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unrestrict user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restricted-users'] });
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/me/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deactivatePassword, confirm: deactivateConfirm }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to deactivate account');
      }
      return res.json();
    },
    onSuccess: () => {
      window.location.href = '/login';
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      is_private: isPrivate,
      show_activity_status: showActivityStatus,
      allow_tagging: allowTagging,
      require_tagging_approval: requireTaggingApproval,
      limit_tags_to_followers: limitTagsToFollowers,
      allow_mentions: allowMentions,
      require_mention_approval: requireMentionApproval,
      limit_mentions_to_followers: limitMentionsToFollowers,
      show_liked_posts: showLikedPosts,
      allow_reposts: allowReposts,
      require_repost_approval: requireRepostApproval,
      hide_from_discovery: hideFromDiscovery,
      dont_suggest_account: dontSuggestAccount,
      hide_followers_list: hideFollowersList,
      hide_following_list: hideFollowingList,
      hide_engagement_counts: hideEngagementCounts,
    });
  };

  const handleExportData = () => {
    window.open('/api/users/me/export-data', '_blank');
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

  const blockedUsers: BlockedUser[] = blockedData?.blocked || [];
  const mutedUsers: MutedUser[] = mutedData?.muted || [];
  const restrictedUsers: RestrictedUser[] = restrictedData?.restricted || [];

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
          <Lock size={20} className="text-emerald-400" />
          <h1 className="text-xl font-bold">Privacy & Safety</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account Privacy */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Account Privacy
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={isPrivate ? Lock : Users}
              iconColor={isPrivate ? 'text-emerald-400' : undefined}
              title="Private Account"
              description={isPrivate ? 'Only approved followers can see your posts' : 'Anyone can see your posts'}
              enabled={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
            />
          </div>
        </section>

        {/* Discoverability */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Discoverability
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={Search}
              iconColor={hideFromDiscovery ? 'text-yellow-400' : undefined}
              title="Hide from Discovery"
              description="Don't show your posts in Explore or trending feeds"
              enabled={hideFromDiscovery}
              onChange={() => setHideFromDiscovery(!hideFromDiscovery)}
            />
            <SettingRow
              icon={UserMinus}
              iconColor={dontSuggestAccount ? 'text-yellow-400' : undefined}
              title="Don't Suggest My Account"
              description="Don't suggest your account to others to follow"
              enabled={dontSuggestAccount}
              onChange={() => setDontSuggestAccount(!dontSuggestAccount)}
            />
          </div>
        </section>

        {/* Profile Visibility */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Profile Visibility
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={Users}
              iconColor={hideFollowersList ? 'text-yellow-400' : undefined}
              title="Hide Followers List"
              description="Others can't see who follows you"
              enabled={hideFollowersList}
              onChange={() => setHideFollowersList(!hideFollowersList)}
            />
            <SettingRow
              icon={Users}
              iconColor={hideFollowingList ? 'text-yellow-400' : undefined}
              title="Hide Following List"
              description="Others can't see who you follow"
              enabled={hideFollowingList}
              onChange={() => setHideFollowingList(!hideFollowingList)}
            />
            <SettingRow
              icon={Hash}
              iconColor={hideEngagementCounts ? 'text-yellow-400' : undefined}
              title="Hide Engagement Counts"
              description="Hide like, save, and view counts on your posts"
              enabled={hideEngagementCounts}
              onChange={() => setHideEngagementCounts(!hideEngagementCounts)}
            />
          </div>
        </section>

        {/* Reposts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Reposts
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={Repeat}
              iconColor={allowReposts ? 'text-emerald-400' : undefined}
              title="Allow Reposts"
              description="Let others repost your public content"
              enabled={allowReposts}
              onChange={() => setAllowReposts(!allowReposts)}
            />
            {allowReposts && (
              <SettingRow
                icon={Shield}
                iconColor={requireRepostApproval ? 'text-yellow-400' : undefined}
                title="Require Approval"
                description="Review and approve repost requests before they appear"
                enabled={requireRepostApproval}
                onChange={() => setRequireRepostApproval(!requireRepostApproval)}
              />
            )}
          </div>
        </section>

        {/* Activity */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Activity
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={showActivityStatus ? Eye : EyeOff}
              title="Show Activity Status"
              description="Let others see when you were last active"
              enabled={showActivityStatus}
              onChange={() => setShowActivityStatus(!showActivityStatus)}
            />
            <SettingRow
              icon={Shield}
              title="Show Liked Posts"
              description="Allow others to see posts you've liked"
              enabled={showLikedPosts}
              onChange={() => setShowLikedPosts(!showLikedPosts)}
            />
          </div>
        </section>

        {/* Photo & Video Tags */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Photo & Video Tags
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={ImageIcon}
              iconColor={allowTagging ? 'text-emerald-400' : undefined}
              title="Allow Tagging"
              description="Let others tag you in photos, videos, and panoramas"
              enabled={allowTagging}
              onChange={() => setAllowTagging(!allowTagging)}
            />
            {allowTagging && (
              <>
                <SettingRow
                  icon={Shield}
                  iconColor={requireTaggingApproval ? 'text-yellow-400' : undefined}
                  title="Require Approval"
                  description="Review and approve tags before they appear on your profile"
                  enabled={requireTaggingApproval}
                  onChange={() => setRequireTaggingApproval(!requireTaggingApproval)}
                />
                <SettingRow
                  icon={Users}
                  iconColor={limitTagsToFollowers ? 'text-yellow-400' : undefined}
                  title="Limit to Followers"
                  description="Only people you follow can tag you"
                  enabled={limitTagsToFollowers}
                  onChange={() => setLimitTagsToFollowers(!limitTagsToFollowers)}
                />
              </>
            )}
          </div>
        </section>

        {/* Mentions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Mentions
          </h2>
          <div className="space-y-3">
            <SettingRow
              icon={AtSign}
              iconColor={allowMentions ? 'text-emerald-400' : undefined}
              title="Allow Mentions"
              description="Let others @mention you in their posts"
              enabled={allowMentions}
              onChange={() => setAllowMentions(!allowMentions)}
            />
            {allowMentions && (
              <>
                <SettingRow
                  icon={Shield}
                  iconColor={requireMentionApproval ? 'text-yellow-400' : undefined}
                  title="Require Approval"
                  description="Approve mentions before they become clickable links to your profile"
                  enabled={requireMentionApproval}
                  onChange={() => setRequireMentionApproval(!requireMentionApproval)}
                />
                <SettingRow
                  icon={Users}
                  iconColor={limitMentionsToFollowers ? 'text-yellow-400' : undefined}
                  title="Limit to Followers"
                  description="Only people you follow can mention you"
                  enabled={limitMentionsToFollowers}
                  onChange={() => setLimitMentionsToFollowers(!limitMentionsToFollowers)}
                />
              </>
            )}
          </div>
        </section>

        {/* Blocked, Muted, Restricted */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Blocked, Muted & Restricted
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowBlockedModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <Ban size={20} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">Blocked Users</p>
                  <p className="text-sm text-gray-300">
                    {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''} blocked
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => setShowMutedModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <VolumeX size={20} className="text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">Muted Users</p>
                  <p className="text-sm text-gray-300">
                    {mutedUsers.length} user{mutedUsers.length !== 1 ? 's' : ''} muted
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => setShowRestrictedModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <UserX size={20} className="text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">Restricted Users</p>
                  <p className="text-sm text-gray-300">
                    {restrictedUsers.length} user{restrictedUsers.length !== 1 ? 's' : ''} restricted
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
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

        {/* Data & Account */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Your Data & Account
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <Download size={20} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">Download Your Data</p>
                  <p className="text-sm text-gray-300">Get a copy of all your data</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => setShowDeactivateModal(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-red-900/50 hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
                  <Power size={20} className="text-red-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-400">Deactivate Account</p>
                  <p className="text-sm text-gray-300">Temporarily disable your account</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <UserListModal
        title="Blocked Users"
        users={blockedUsers}
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onRemove={(username) => unblockMutation.mutate(username)}
        emptyText="You haven't blocked anyone"
      />

      <UserListModal
        title="Muted Users"
        users={mutedUsers}
        isOpen={showMutedModal}
        onClose={() => setShowMutedModal(false)}
        onRemove={(username) => unmuteMutation.mutate(username)}
        emptyText="You haven't muted anyone"
      />

      <UserListModal
        title="Restricted Users"
        users={restrictedUsers}
        isOpen={showRestrictedModal}
        onClose={() => setShowRestrictedModal(false)}
        onRemove={(username) => unrestrictMutation.mutate(username)}
        emptyText="You haven't restricted anyone"
      />

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center">
                <Power size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Deactivate Account</h3>
            </div>

            <p className="text-gray-300 mb-4">
              Your account will be hidden and you'll be logged out. You can reactivate anytime by logging back in.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Enter your password</label>
                <input
                  type="password"
                  value={deactivatePassword}
                  onChange={(e) => setDeactivatePassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Password"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={deactivateConfirm}
                  onChange={(e) => setDeactivateConfirm(e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">I understand and want to deactivate</span>
              </label>

              {deactivateMutation.isError && (
                <p className="text-sm text-red-400">
                  {deactivateMutation.error?.message || 'Failed to deactivate account'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivatePassword('');
                    setDeactivateConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deactivateMutation.mutate()}
                  disabled={!deactivatePassword || !deactivateConfirm || deactivateMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deactivateMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    'Deactivate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
