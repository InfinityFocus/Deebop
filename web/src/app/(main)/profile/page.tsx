'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Grid, Bookmark, Crown, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { FeedContainer } from '@/components/feed';
import { SavedFeedContainer } from '@/components/feed/SavedFeedContainer';
import { MyScheduledDrops } from '@/components/drops/MyScheduledDrops';
import { FollowersModal, FollowingModal } from '@/components/profile';

const TIER_BADGES = {
  free: { label: 'Free', color: 'bg-gray-600' },
  standard: { label: 'Standard', color: 'bg-blue-600' },
  pro: { label: 'Pro', color: 'bg-gradient-to-r from-emerald-500 to-cyan-500' },
};

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'scheduled'>('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  const tierBadge = TIER_BADGES[user.tier];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div>
        {/* Cover Image (placeholder) */}
        {user.cover_image_url ? (
          <img src={user.cover_image_url} alt="Cover" className="h-32 w-full rounded-xl mb-4 object-cover" />
        ) : (
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-yellow-500 to-cyan-500 rounded-xl mb-4" />
        )}

        {/* Avatar and Info */}
        <div className="flex flex-col items-center -mt-16 mb-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || user.username}
              className="w-24 h-24 rounded-full border-4 border-black object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-4 border-black flex items-center justify-center text-3xl font-bold text-white">
              {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <h2 className="text-xl font-bold mt-3">{user.display_name || user.username}</h2>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            @{user.username}
            <Link
              href="/settings"
              className="p-1 hover:bg-gray-800 rounded-lg transition"
            >
              <Settings size={16} />
            </Link>
          </p>

          {/* Tier Badge */}
          <div className={clsx(
            'flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white',
            tierBadge.color
          )}>
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
          <Link
            href="/profile/edit"
            className="flex-1 py-2 text-center bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Edit Profile
          </Link>
          <Link
            href="/profile/groups"
            className="py-2 px-4 flex items-center justify-center gap-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
            title="Manage Audience Groups"
          >
            <Users size={18} />
            Groups
          </Link>
          {user.tier === 'free' && (
            <Link
              href="/settings/subscription"
              className="flex-1 py-2 text-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
            >
              Upgrade
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
          <button
            onClick={() => setActiveTab('scheduled')}
            className={clsx(
              'flex-1 py-3 flex items-center justify-center gap-2 transition',
              activeTab === 'scheduled'
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <Clock size={18} />
            Scheduled
          </button>
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
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeTab === 'posts' && <FeedContainer userId={user.id} />}
          {activeTab === 'scheduled' && <MyScheduledDrops />}
          {activeTab === 'saved' && <SavedFeedContainer />}
        </div>
      </div>

      {/* Modals */}
      <FollowersModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        isOwnProfile={true}
      />
      <FollowingModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        isOwnProfile={true}
      />
    </div>
  );
}
