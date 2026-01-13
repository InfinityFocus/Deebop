'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Ban, VolumeX, ShieldAlert, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ProfileActionsMenuProps {
  username: string;
}

export function ProfileActionsMenu({ username }: ProfileActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch current relationship status
  const { data: status } = useQuery({
    queryKey: ['user-relationship', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/relationship`);
      if (!res.ok) return { is_blocked: false, is_muted: false, is_restricted: false };
      return res.json();
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/block`, {
        method: status?.is_blocked ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('Failed to update block status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-relationship', username] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      setIsOpen(false);
    },
  });

  const muteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/mute`, {
        method: status?.is_muted ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('Failed to update mute status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-relationship', username] });
      setIsOpen(false);
    },
  });

  const restrictMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${username}/restrict`, {
        method: status?.is_restricted ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('Failed to update restrict status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-relationship', username] });
      setIsOpen(false);
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPending = blockMutation.isPending || muteMutation.isPending || restrictMutation.isPending;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-800 rounded-lg transition"
        title="More options"
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => blockMutation.mutate()}
            disabled={isPending}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition text-left"
          >
            {blockMutation.isPending ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Ban size={18} className={status?.is_blocked ? 'text-red-400' : 'text-gray-400'} />
            )}
            <span className={status?.is_blocked ? 'text-red-400' : ''}>
              {status?.is_blocked ? 'Unblock @' + username : 'Block @' + username}
            </span>
          </button>

          <button
            onClick={() => muteMutation.mutate()}
            disabled={isPending}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition text-left"
          >
            {muteMutation.isPending ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <VolumeX size={18} className={status?.is_muted ? 'text-orange-400' : 'text-gray-400'} />
            )}
            <span className={status?.is_muted ? 'text-orange-400' : ''}>
              {status?.is_muted ? 'Unmute @' + username : 'Mute @' + username}
            </span>
          </button>

          <button
            onClick={() => restrictMutation.mutate()}
            disabled={isPending}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition text-left"
          >
            {restrictMutation.isPending ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <ShieldAlert size={18} className={status?.is_restricted ? 'text-yellow-400' : 'text-gray-400'} />
            )}
            <span className={status?.is_restricted ? 'text-yellow-400' : ''}>
              {status?.is_restricted ? 'Unrestrict @' + username : 'Restrict @' + username}
            </span>
          </button>

          <div className="border-t border-gray-800 px-4 py-2">
            <p className="text-xs text-gray-500">
              {status?.is_blocked && 'This user is blocked. They cannot see your profile or content.'}
              {status?.is_muted && !status?.is_blocked && 'This user is muted. Their posts won\'t appear in your feed.'}
              {status?.is_restricted && !status?.is_blocked && !status?.is_muted && 'This user is restricted. They can only see your public posts.'}
              {!status?.is_blocked && !status?.is_muted && !status?.is_restricted && 'Manage your relationship with this user.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
