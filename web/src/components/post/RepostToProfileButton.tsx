'use client';

import { useState } from 'react';
import { Copy, Loader2, Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useTierGate } from '@/hooks/useTierGate';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface RepostToProfileButtonProps {
  postId: string;
  onSuccess?: (newPostId: string, targetProfile: Profile) => void;
  className?: string;
}

export function RepostToProfileButton({
  postId,
  onSuccess,
  className,
}: RepostToProfileButtonProps) {
  const { user, identity } = useAuth();
  const { isCreator, isPro, isTeams, isFree } = useTierGate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Only show for Creator+ tiers with multiple profiles
  const canRepost = isCreator || isPro || isTeams;

  if (isFree || !canRepost) {
    return null;
  }

  const fetchProfiles = async () => {
    if (profiles.length > 0) return;

    setLoadingProfiles(true);
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        // Filter out current profile
        const otherProfiles = data.profiles.filter(
          (p: Profile) => p.id !== user?.id
        );
        setProfiles(otherProfiles);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchProfiles();
    }
    setIsOpen(!isOpen);
    setError(null);
    setSuccess(false);
  };

  const handleRepost = async (targetProfile: Profile) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/repost-to-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: targetProfile.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setIsOpen(false);
        onSuccess?.(data.post.id, targetProfile);

        // Reset success after a delay
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to repost');
      }
    } catch (err) {
      console.error('Repost error:', err);
      setError('Failed to repost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition',
          success
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        )}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : success ? (
          <Check size={16} />
        ) : (
          <Copy size={16} />
        )}
        <span>{success ? 'Reposted!' : 'Repost to profile'}</span>
        {!success && <ChevronDown size={14} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs text-gray-400 px-2 pb-2">
              Select a profile to repost to:
            </p>

            {loadingProfiles ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No other profiles available
              </p>
            ) : (
              <div className="space-y-1">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleRepost(profile)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-sm text-gray-400">
                          {(profile.displayName || profile.username)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm text-white font-medium">
                        {profile.displayName || profile.username}
                      </p>
                      <p className="text-xs text-gray-400">@{profile.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 px-2 pt-2">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
