'use client';

import { useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Grid, Bookmark, Crown, UserPlus, UserCheck, Clock, Loader2, ArrowLeft, Link2, Star } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { FeedContainer } from '@/components/feed';
import { FollowersModal, FollowingModal, ProfileActionsMenu } from '@/components/profile';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  profile_link: string | null;
  tier: string;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  is_follow_requested: boolean;
  is_favourited: boolean;
  is_own_profile: boolean;
}

const TIER_BADGES: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-gray-600' },
  standard: { label: 'Standard', color: 'bg-blue-600' },
  pro: { label: 'Pro', color: 'bg-gradient-to-r from-emerald-500 to-cyan-500' },
};

async function fetchUser(username: string): Promise<{ user: UserProfile }> {
  const res = await fetch(`/api/users/${username}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    throw new Error('Failed to fetch user');
  }
  return res.json();
}

async function fetchFavouritesSettings(): Promise<{ isEnabled: boolean }> {
  const res = await fetch('/api/favourites/settings');
  if (!res.ok) return { isEnabled: false };
  return res.json();
}

export function ProfileContent({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get('post') || undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetchUser(username),
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to follow');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] });
    },
  });

  // Fetch favourites settings
  const { data: favouritesSettings } = useQuery({
    queryKey: ['favourites-settings'],
    queryFn: fetchFavouritesSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const favouritesEnabled = favouritesSettings?.isEnabled ?? false;

  const favouriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/favourite`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle favourite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">
          {error instanceof Error && error.message === 'User not found'
            ? 'User not found'
            : 'Error loading profile'}
        </h1>
        <p className="text-gray-500 mb-4">
          {error instanceof Error && error.message === 'User not found'
            ? 'This user doesn\'t exist.'
            : 'Please try again later.'}
        </p>
        <Link href="/home" className="text-emerald-400 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const user = data!.user;
  const tierBadge = TIER_BADGES[user.tier] || TIER_BADGES.free;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Cover Image */}
      <div className="relative">
        {user.cover_image_url ? (
          <img
            src={user.cover_image_url}
            alt="Cover"
            className="h-32 w-full rounded-xl mb-4 object-cover"
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-yellow-500 to-cyan-500 rounded-xl mb-4" />
        )}

        {/* Navigation buttons overlaid on cover image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {user.is_own_profile ? (
              <Link href="/settings" className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition backdrop-blur-sm">
                <Settings size={20} />
              </Link>
            ) : currentUser && (
              <div className="bg-black/50 rounded-full backdrop-blur-sm">
                <ProfileActionsMenu username={user.username} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar and Info */}
      <div className="flex flex-col items-center -mt-16 mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-4 border-black flex items-center justify-center text-3xl font-bold text-white">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()
            )}
          </div>

          <h2 className="text-xl font-bold mt-3">{user.display_name || user.username}</h2>
          <p className="text-gray-500">@{user.username}</p>

          {/* Tier Badge */}
          <div
            className={clsx(
              'flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white',
              tierBadge.color
            )}
          >
            {user.tier === 'pro' && <Crown size={12} />}
            {tierBadge.label}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-center text-gray-300 mt-3 max-w-sm">{user.bio}</p>
          )}

          {/* Profile Link */}
          {user.profile_link && (
            <a
              href={user.profile_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-sm mt-2"
            >
              {user.profile_link.replace(/^https?:\/\//, '')}
            </a>
          )}

          {/* Creator Page Link - for Standard/Pro users */}
          {(user.tier === 'standard' || user.tier === 'pro') && (
            <Link
              href={`/u/${user.username}/hub`}
              className="flex items-center gap-2 mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-white transition"
            >
              <Link2 size={14} />
              View Creator Page
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 py-4 border-y border-gray-800">
          <div className="text-center">
            <p className="font-bold text-lg">{user.posts_count}</p>
            <p className="text-gray-500 text-sm">Posts</p>
          </div>
          <button
            onClick={() => setShowFollowers(true)}
            className="text-center hover:bg-gray-800/50 px-3 py-1 -my-1 rounded-lg transition"
          >
            <p className="font-bold text-lg">{user.followers_count}</p>
            <p className="text-gray-500 text-sm">Followers</p>
          </button>
          <button
            onClick={() => setShowFollowing(true)}
            className="text-center hover:bg-gray-800/50 px-3 py-1 -my-1 rounded-lg transition"
          >
            <p className="font-bold text-lg">{user.following_count}</p>
            <p className="text-gray-500 text-sm">Following</p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {user.is_own_profile ? (
            <>
              <Link
                href="/profile/edit"
                className="flex-1 py-2 text-center bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
              >
                Edit Profile
              </Link>
              {user.tier === 'free' && (
                <Link
                  href="/settings/subscription"
                  className="flex-1 py-2 text-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
                >
                  Upgrade
                </Link>
              )}
            </>
          ) : currentUser ? (
            <>
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={clsx(
                  'flex-1 py-2 font-semibold rounded-lg transition flex items-center justify-center gap-2',
                  user.is_following
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : user.is_follow_requested
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-white text-black hover:bg-gray-200'
                )}
              >
                {followMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : user.is_following ? (
                  <>
                    <UserCheck size={16} />
                    Following
                  </>
                ) : user.is_follow_requested ? (
                  <>
                    <Clock size={16} />
                    Requested
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Follow
                  </>
                )}
              </button>
              {/* Favourite/Star button - only show when feature is enabled */}
              {favouritesEnabled && (
                <button
                  onClick={() => favouriteMutation.mutate()}
                  disabled={favouriteMutation.isPending}
                  title={user.is_favourited ? 'Remove from Favourites' : 'Add to Favourites'}
                  className={clsx(
                    'p-2 rounded-lg transition flex items-center justify-center',
                    user.is_favourited
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
                  )}
                >
                  {favouriteMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Star
                      size={20}
                      className={clsx(user.is_favourited && 'fill-yellow-400')}
                    />
                  )}
                </button>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="flex-1 py-2 text-center bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Sign in to follow
            </Link>
          )}
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-gray-800 mt-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={clsx(
              'flex-1 py-3 flex items-center justify-center gap-2 transition',
              activeTab === 'posts'
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <Grid size={18} />
            Posts
          </button>
          {user.is_own_profile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={clsx(
                'flex-1 py-3 flex items-center justify-center gap-2 transition',
                activeTab === 'saved'
                  ? 'text-white border-b-2 border-emerald-500'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Bookmark size={18} />
              Saved
            </button>
          )}
        </div>

      {/* User's Posts */}
      <div className="mt-4">
        {activeTab === 'posts' ? (
          <FeedContainer userId={user.id} highlightPostId={highlightPostId} />
        ) : (
          <div className="text-center py-16">
            <Bookmark className="mx-auto text-gray-500 mb-4" size={32} />
            <p className="text-gray-500">Saved posts feature coming soon</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <FollowersModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        username={user.username}
        isOwnProfile={user.is_own_profile}
      />
      <FollowingModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        username={user.username}
        isOwnProfile={user.is_own_profile}
      />
    </div>
  );
}
