'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileSummary } from '@/types/database';

interface ProfileSwitcherProps {
  className?: string;
  showAddProfile?: boolean;
}

export function ProfileSwitcher({ className, showAddProfile = true }: ProfileSwitcherProps) {
  const { user, profiles, canAddProfile, switchProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if no profiles or only one profile (unless showAddProfile is true and can add)
  if (!user || profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1 && !canAddProfile) {
    return null;
  }

  const handleSwitch = async (profile: ProfileSummary) => {
    if (profile.id === user?.id || profile.is_suspended) return;

    setIsLoading(profile.id);
    try {
      await switchProfile(profile.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition"
      >
        {/* Current profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            user?.display_name?.[0]?.toUpperCase() || user?.username[0].toUpperCase()
          )}
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            'text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown - opens upward since it's at bottom of sidebar */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Current profile header */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current Profile</p>
            <p className="font-semibold text-white truncate">@{user?.username}</p>
          </div>

          {/* Profile list - scrollable with max height */}
          <div className="py-2 max-h-48 overflow-y-auto scrollbar-thin">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSwitch(profile)}
                disabled={profile.id === user?.id || profile.is_suspended || isLoading !== null}
                className={clsx(
                  'w-full px-4 py-2 flex items-center gap-3 transition',
                  profile.id === user?.id
                    ? 'bg-gray-800/50'
                    : profile.is_suspended
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-800 cursor-pointer'
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
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
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-white truncate">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="text-sm text-gray-400 truncate">@{profile.username}</p>
                </div>

                {/* Status */}
                {isLoading === profile.id ? (
                  <Loader2 size={18} className="text-emerald-400 animate-spin" />
                ) : profile.id === user?.id ? (
                  <Check size={18} className="text-emerald-400" />
                ) : profile.is_suspended ? (
                  <span className="text-xs text-red-400">Suspended</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Add profile option */}
          {showAddProfile && canAddProfile && (
            <div className="border-t border-gray-800 py-2">
              <Link
                href="/settings/profiles/new"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-800 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <Plus size={20} className="text-gray-400" />
                </div>
                <span className="text-gray-300">Add Profile</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
