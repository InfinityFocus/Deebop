'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, Plus, Link as LinkIcon, Loader2, Lock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { useEventInviteLinks, useCreateInviteLink, useRevokeInviteLink } from '@/hooks/useEventInvites';
import type { EventInviteLinkDetail } from '@/types/event';

interface InviteLinkManagerProps {
  eventId: string;
}

export function InviteLinkManager({ eventId }: InviteLinkManagerProps) {
  const { data, isLoading, error } = useEventInviteLinks(eventId);
  const { mutate: createLink, isPending: isCreating } = useCreateInviteLink(eventId);
  const { mutate: revokeLink, isPending: isRevoking } = useRevokeInviteLink(eventId);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLinkMaxUses, setNewLinkMaxUses] = useState(50);
  const [newLinkIsRestricted, setNewLinkIsRestricted] = useState(false);

  const copyToClipboard = async (link: EventInviteLinkDetail) => {
    const url = `${window.location.origin}/events/join/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(link.token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCreateLink = () => {
    createLink(
      { maxUses: newLinkMaxUses, isRestricted: newLinkIsRestricted },
      {
        onSuccess: () => {
          setShowNewForm(false);
          setNewLinkMaxUses(50);
          setNewLinkIsRestricted(false);
        },
      }
    );
  };

  const handleRevoke = (token: string) => {
    if (confirm('Are you sure you want to revoke this invite link?')) {
      revokeLink(token);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-800 rounded-lg" />
        <div className="h-16 bg-gray-800 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400">
        Failed to load invite links
      </div>
    );
  }

  const links = data?.inviteLinks ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Shareable Invite Links</h3>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Link
        </button>
      </div>

      {/* New Link Form */}
      {showNewForm && (
        <div className="p-4 bg-gray-800 rounded-lg space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Max Uses</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={newLinkMaxUses}
              onChange={(e) => setNewLinkMaxUses(parseInt(e.target.value) || 50)}
              className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newLinkIsRestricted}
                onChange={(e) => setNewLinkIsRestricted(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-800"
              />
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">Restrict to invited guests only</span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Only users who have been directly invited can use this link
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateLink}
              disabled={isCreating}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <LinkIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No invite links created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`p-4 rounded-lg border ${
                link.isUsable
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-800/50 border-gray-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <code className="text-sm text-emerald-400 bg-gray-700 px-2 py-1 rounded truncate">
                      /events/join/{link.token.slice(0, 8)}...
                    </code>
                    {link.isRestricted ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                        <Lock className="w-3 h-3" />
                        Restricted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        <Globe className="w-3 h-3" />
                        Open
                      </span>
                    )}
                    {!link.isUsable && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                        {link.isRevoked ? 'Revoked' : link.isExpired ? 'Expired' : 'Used up'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {link.usedCount} / {link.maxUses} uses
                    {link.expiresAt && (
                      <> · Expires {format(new Date(link.expiresAt), 'MMM d, yyyy')}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {link.isUsable && (
                    <button
                      onClick={() => copyToClipboard(link)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      {copiedToken === link.token ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  )}
                  {!link.isRevoked && (
                    <button
                      onClick={() => handleRevoke(link.token)}
                      disabled={isRevoking}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                      title="Revoke link"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
