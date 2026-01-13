'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  allowTagging?: boolean;
}

interface UserTagSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: SearchUser) => void;
  position: { x: number; y: number };
  excludeUserIds?: string[];
}

export function UserTagSearch({
  isOpen,
  onClose,
  onSelectUser,
  position,
  excludeUserIds = [],
}: UserTagSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Search users
  useEffect(() => {
    // Strip @ from the beginning of the query
    const cleanQuery = query.trim().replace(/^@/, '');

    if (!cleanQuery) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(cleanQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          // Filter out excluded users
          const filtered = (data.users || []).filter(
            (u: SearchUser) => !excludeUserIds.includes(u.id)
          );
          setResults(filtered);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, excludeUserIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-sm mx-4 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Tag Someone</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Position indicator */}
        <div className="px-4 py-2 bg-gray-800/50 text-xs text-gray-400">
          Tagging at position: {Math.round(position.x)}%, {Math.round(position.y)}%
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a user..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="px-2 pb-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  disabled={user.allowTagging === false}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition',
                    user.allowTagging === false
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-800'
                  )}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                  {user.allowTagging === false && (
                    <span className="text-xs text-gray-500">Tagging disabled</span>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-8 text-center text-gray-400">No users found</div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              Start typing to search for users
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
