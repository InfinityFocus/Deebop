'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check, Trash2, Star, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';

export default function ProfilesPage() {
  const router = useRouter();
  const { user, identity, profiles, profileLimit, canAddProfile, switchProfile, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSwitch = async (profileId: string) => {
    if (profileId === user?.id) return;
    setIsLoading(profileId);
    try {
      await switchProfile(profileId);
    } catch (error) {
      console.error('Switch failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleSetDefault = async (profileId: string) => {
    setIsLoading(profileId);
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Set default failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (profiles.length <= 1) return;
    setIsLoading(profileId);
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteConfirm(null);
        await refreshUser();
        // If we deleted the current profile, the API will have switched us
        if (profileId === user?.id) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Manage Profiles" />

      {/* Tier info */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Your <span className="capitalize font-medium text-white">{identity?.tier || 'free'}</span> plan includes
            </p>
            <p className="text-lg font-bold">
              {profiles.length} / {profileLimit} Profiles
            </p>
          </div>
          {identity?.tier === 'free' && (
            <Link
              href="/settings/subscription"
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition text-sm"
            >
              Upgrade for More
            </Link>
          )}
        </div>
      </div>

      {/* Profile list */}
      <div className="space-y-4">
        {profiles.map((profile) => {
          const isCurrentProfile = profile.id === user?.id;
          const isDeleting = deleteConfirm === profile.id;

          return (
            <div
              key={profile.id}
              className={clsx(
                'p-4 rounded-xl border transition',
                isCurrentProfile
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-800 bg-gray-900/50'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">
                      {profile.display_name || profile.username}
                    </p>
                    {profile.is_default && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {isCurrentProfile && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                    {profile.is_suspended && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">@{profile.username}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isCurrentProfile && !profile.is_suspended && (
                    <button
                      onClick={() => handleSwitch(profile.id)}
                      disabled={isLoading !== null}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                    >
                      {isLoading === profile.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Switch'
                      )}
                    </button>
                  )}
                  {!profile.is_default && !profile.is_suspended && (
                    <button
                      onClick={() => handleSetDefault(profile.id)}
                      disabled={isLoading !== null}
                      title="Set as default"
                      className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded transition"
                    >
                      <Star size={18} />
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => setDeleteConfirm(profile.id)}
                      disabled={isLoading !== null}
                      title="Delete profile"
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Delete confirmation */}
              {isDeleting && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 mb-3">
                    Are you sure you want to delete @{profile.username}? All posts, followers, and content will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(profile.id)}
                      disabled={isLoading !== null}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                    >
                      {isLoading === profile.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Delete Profile'
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add profile button */}
      {canAddProfile ? (
        <Link
          href="/settings/profiles/new"
          className="mt-6 flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-xl text-gray-400 hover:text-emerald-400 transition"
        >
          <Plus size={20} />
          <span>Add New Profile</span>
        </Link>
      ) : (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-center">
          <p className="text-gray-400 mb-2">
            You have reached the maximum profiles for your plan.
          </p>
          <Link
            href="/settings/subscription"
            className="text-emerald-400 hover:underline"
          >
            Upgrade to add more profiles
          </Link>
        </div>
      )}
    </div>
  );
}
