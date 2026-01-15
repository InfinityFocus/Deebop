'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Settings, Users } from 'lucide-react';
import { Button } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';
import type { Child } from '@/types';

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChildren() {
      try {
        const response = await fetch('/api/parent/children');
        const data = await response.json();

        if (data.success) {
          setChildren(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch children:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChildren();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Children</h1>
          <p className="text-gray-400">Manage your children&apos;s accounts</p>
        </div>
        <Link href="/children/new">
          <Button>
            <UserPlus size={18} className="mr-2" />
            Add Child
          </Button>
        </Link>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No children yet</h2>
          <p className="text-gray-400 mb-6">
            Create a child account to get started with safe messaging
          </p>
          <Link href="/children/new">
            <Button>
              <UserPlus size={18} className="mr-2" />
              Add Your First Child
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: Child }) {
  const oversightLabels = {
    monitor: 'Monitor Only',
    approve_first: 'Approve First',
    approve_all: 'Approve All',
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center gap-4">
        <Avatar avatarId={child.avatarId} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">{child.displayName}</h3>
            {child.messagingPaused && (
              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                Paused
              </span>
            )}
          </div>
          <p className="text-gray-400">@{child.username}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Age: {child.ageBand}</span>
            <span>•</span>
            <span>{oversightLabels[child.oversightMode]}</span>
          </div>
        </div>

        <Link href={`/children/${child.id}`}>
          <Button variant="outline" size="sm">
            <Settings size={16} className="mr-1" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
