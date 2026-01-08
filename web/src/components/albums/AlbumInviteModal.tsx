'use client';

import { useState } from 'react';
import { X, Search, Loader2, Crown, Shield, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useInviteAlbumMember } from '@/hooks/useAlbum';
import type { AlbumRole } from '@/types/album';

interface AlbumInviteModalProps {
  albumId: string;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function AlbumInviteModal({ albumId, onClose }: AlbumInviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [role, setRole] = useState<'co_owner' | 'contributor'>('contributor');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inviteMember = useInviteAlbumMember(albumId);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) return;

    setError('');
    try {
      await inviteMember.mutateAsync({
        userId: selectedUser.id,
        role,
        message: message.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    }
  };

  const roleOptions = [
    {
      value: 'contributor' as const,
      label: 'Contributor',
      icon: User,
      description: 'Can upload their own media',
    },
    {
      value: 'co_owner' as const,
      label: 'Co-owner',
      icon: Shield,
      description: 'Can manage album and members',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Invite to Album</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* User Search */}
          {!selectedUser ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search for a user
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
                />
                {isSearching && (
                  <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-700 rounded-lg overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.display_name?.[0]?.toUpperCase() ||
                          user.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">No users found</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inviting
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedUser.display_name?.[0]?.toUpperCase() ||
                      selectedUser.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {selectedUser.display_name || selectedUser.username}
                    </p>
                    <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded hover:bg-gray-700 transition"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Role Selection */}
          {selectedUser && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={clsx(
                        'flex flex-col items-center p-3 rounded-lg border transition',
                        role === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      )}
                    >
                      <option.icon
                        size={20}
                        className={clsx(
                          'mb-1',
                          role === option.value ? 'text-emerald-400' : 'text-gray-400'
                        )}
                      />
                      <span
                        className={clsx(
                          'font-medium text-sm',
                          role === option.value ? 'text-white' : 'text-gray-300'
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
                  maxLength={200}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUser || inviteMember.isPending}
            className={clsx(
              'flex-1 py-3 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2',
              !selectedUser || inviteMember.isPending
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
            )}
          >
            {inviteMember.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send Invite'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
