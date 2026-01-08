'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Images, Loader2 } from 'lucide-react';
import { useAcceptAlbumInvite, useDeclineAlbumInvite } from '@/hooks/useAlbumInvites';
import type { AlbumInvite } from '@/types/album';

interface AlbumInviteCardProps {
  invite: AlbumInvite;
}

export function AlbumInviteCard({ invite }: AlbumInviteCardProps) {
  const acceptInvite = useAcceptAlbumInvite();
  const declineInvite = useDeclineAlbumInvite();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptInvite.mutateAsync(invite.id);
    } catch (err) {
      console.error('Failed to accept invite:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await declineInvite.mutateAsync(invite.id);
    } catch (err) {
      console.error('Failed to decline invite:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(invite.created_at), { addSuffix: true });
  const roleLabel = invite.role === 'co_owner' ? 'Co-owner' : 'Contributor';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex gap-4">
        {/* Album Cover */}
        <div className="w-20 h-20 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
          {invite.album.cover_image_url ? (
            <img
              src={invite.album.cover_image_url}
              alt={invite.album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Images size={24} className="text-gray-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{invite.album.title}</h3>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-gray-300">{invite.inviter.display_name || invite.inviter.username}</span>
            {' invited you as '}
            <span className="text-emerald-400">{roleLabel}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>

          {invite.message && (
            <p className="text-sm text-gray-400 mt-2 italic">"{invite.message}"</p>
          )}

          {/* Album Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{invite.album.items_count} items</span>
            <span>{invite.album.members_count} members</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleDecline}
          disabled={isProcessing}
          className="flex-1 py-2 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <X size={16} />
              Decline
            </>
          )}
        </button>
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} />
              Accept
            </>
          )}
        </button>
      </div>
    </div>
  );
}
