'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Images, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { AlbumGrid } from '@/components/albums';
import { AlbumInviteCard } from '@/components/albums/AlbumInviteCard';
import { StorageUsageBar } from '@/components/subscription/StorageUsageBar';
import { useAuth } from '@/hooks/useAuth';
import { useAlbumInvites, usePendingInviteCount } from '@/hooks/useAlbumInvites';

interface StorageData {
  used: number;
  max: number;
  percentage: number;
}

type Tab = 'feed' | 'owned' | 'shared' | 'saved' | 'invites';

export default function AlbumsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [storage, setStorage] = useState<StorageData | null>(null);
  const { data: invites, isLoading: invitesLoading } = useAlbumInvites();
  const inviteCount = usePendingInviteCount();

  // Fetch storage usage for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/subscriptions/status')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.storage) {
            setStorage(data.storage);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const tabs: { value: Tab; label: string; authRequired?: boolean }[] = [
    { value: 'feed', label: 'Discover' },
    { value: 'owned', label: 'My Albums', authRequired: true },
    { value: 'shared', label: 'Shared with Me', authRequired: true },
    { value: 'saved', label: 'Saved', authRequired: true },
    { value: 'invites', label: 'Invites', authRequired: true },
  ];

  const filteredTabs = tabs.filter((tab) => !tab.authRequired || isAuthenticated);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Albums</h1>
          <p className="text-gray-500 mt-1">
            Collaborative photo and video collections
          </p>
        </div>

        {isAuthenticated && (
          <Link
            href="/albums/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Create Album
          </Link>
        )}
      </div>

      {/* Storage Usage */}
      {isAuthenticated && storage && (
        <div className="mb-6">
          <StorageUsageBar
            used={storage.used}
            max={storage.max}
            percentage={storage.percentage}
            compact
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filteredTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={clsx(
              'px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition relative',
              activeTab === tab.value
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {tab.label}
            {tab.value === 'invites' && inviteCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                {inviteCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'invites' ? (
        <div className="space-y-4">
          {invitesLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : !invites || invites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-500" size={28} />
              </div>
              <p className="text-gray-500 text-lg">No pending invites</p>
            </div>
          ) : (
            invites.map((invite) => (
              <AlbumInviteCard key={invite.id} invite={invite} />
            ))
          )}
        </div>
      ) : (
        <AlbumGrid
          type={activeTab === 'feed' ? 'feed' : activeTab}
          userId={activeTab !== 'feed' ? user?.id : undefined}
          columns={2}
          emptyMessage={
            activeTab === 'feed'
              ? 'No albums to show'
              : activeTab === 'owned'
              ? "You haven't created any albums yet"
              : activeTab === 'shared'
              ? 'No albums shared with you'
              : 'No saved albums'
          }
          emptyAction={
            activeTab === 'owned' ? (
              <Link
                href="/albums/create"
                className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-full hover:opacity-90 transition mt-4"
              >
                Create Your First Album
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
