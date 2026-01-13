'use client';

import { useState } from 'react';
import { X, Search, Loader2, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserListItem {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followed_at: string;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string; // If provided, fetch this user's following; otherwise fetch own following
  isOwnProfile: boolean;
}

export function FollowingModal({ isOpen, onClose, username, isOwnProfile }: FollowingModalProps) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['following', username || 'me', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '50');

      const endpoint = username
        ? `/api/users/${username}/following?${params}`
        : `/api/users/me/following?${params}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch following');
      return res.json();
    },
    enabled: isOpen,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUsername: string) => {
      const res = await fetch(`/api/users/${targetUsername}/follow`, {
        method: 'POST', // Toggle - will unfollow if already following
      });
      if (!res.ok) throw new Error('Failed to unfollow');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Following</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search following..."
              className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500"></div>
            </div>
          ) : data?.following?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {search ? 'No users found' : 'Not following anyone yet'}
            </p>
          ) : (
            data?.following?.map((following: UserListItem) => (
              <div
                key={following.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
              >
                <Link
                  href={`/u/${following.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {following.avatar_url ? (
                    <img
                      src={following.avatar_url}
                      alt={following.display_name || following.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {(following.display_name || following.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{following.display_name || following.username}</p>
                    <p className="text-sm text-gray-500 truncate">@{following.username}</p>
                  </div>
                </Link>
                {isOwnProfile && (
                  <button
                    onClick={() => unfollowMutation.mutate(following.username)}
                    disabled={unfollowMutation.isPending}
                    className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-1.5 flex-shrink-0"
                    title="Unfollow"
                  >
                    {unfollowMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <UserMinus size={14} />
                        Unfollow
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
