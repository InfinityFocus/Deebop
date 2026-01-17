'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Avatar, AvatarSelector } from '@/components/child/AvatarSelector';
import { useAuthStore } from '@/stores/authStore';

interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarId: string;
  ageBand: string;
  voiceMessagingEnabled: boolean;
}

export default function ChildSettingsPage() {
  const { user, refreshUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/child/profile');
        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
          setSelectedAvatar(data.data.avatarId);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleAvatarSelect = async (avatarId: string) => {
    if (avatarId === selectedAvatar) return;

    setSelectedAvatar(avatarId);
    setIsSaving(true);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/child/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setShowSuccess(true);
        // Refresh the user data in the auth store to update navbar
        refreshUser();
        // Hide success message after 2 seconds
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        // Revert on error
        setSelectedAvatar(profile?.avatarId || '');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      // Revert on error
      setSelectedAvatar(profile?.avatarId || '');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar avatarId={selectedAvatar} size="xl" />
        </div>
        <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
        <p className="text-gray-400">@{profile.username}</p>
      </div>

      {/* Avatar Selection */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Choose your avatar</h2>
          {isSaving && (
            <div className="flex items-center gap-2 text-cyan-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </div>
          )}
          {showSuccess && !isSaving && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Check size={16} />
              Saved!
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Tap on any avatar to make it yours. Your friends will see this picture!
        </p>
        <AvatarSelector
          selected={selectedAvatar}
          onSelect={handleAvatarSelect}
          size="lg"
        />
      </div>

      {/* Info Card */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">About you</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Username</span>
            <span className="text-white">@{profile.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Display name</span>
            <span className="text-white">{profile.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Voice messages</span>
            <span className={profile.voiceMessagingEnabled ? 'text-emerald-400' : 'text-gray-500'}>
              {profile.voiceMessagingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Ask a parent if you want to change your name or other settings.
        </p>
      </div>
    </div>
  );
}
