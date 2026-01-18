'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  FileText,
  Settings,
  Loader2,
  UserPlus,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useTierGate } from '@/hooks/useTierGate';
import { PageHeader } from '@/components/layout/PageHeader';

interface Member {
  id: string;
  role: string;
  invitedAt: string;
  joinedAt: string | null;
  isPending: boolean;
  isOwner: boolean;
  identity: {
    id: string;
    email: string;
    profiles: Array<{
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    }>;
  };
}

interface Draft {
  id: string;
  contentType: string;
  headline: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface WorkspaceData {
  id: string;
  name: string;
  isOwner: boolean;
  role: string;
  memberCount: number;
  draftCount: number;
  createdAt: string;
  members: Member[];
  recentDrafts: Draft[];
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isTeams } = useTierGate();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const workspaceId = params.id as string;

  useEffect(() => {
    if (!isTeams || !workspaceId) return;
    fetchWorkspace();
  }, [isTeams, workspaceId]);

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
      } else if (res.status === 404) {
        setError('Workspace not found');
      } else if (res.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load workspace');
      }
    } catch (err) {
      console.error('Fetch workspace error:', err);
      setError('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        setInviteEmail('');
        setShowInviteModal(false);
        fetchWorkspace();
      } else {
        const data = await res.json();
        setInviteError(data.error || 'Failed to invite member');
      }
    } catch (err) {
      console.error('Invite error:', err);
      setInviteError('Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/workspace');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete workspace');
      }
    } catch (err) {
      console.error('Delete workspace error:', err);
      alert('Failed to delete workspace');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
            <Clock size={12} />
            Draft
          </span>
        );
      case 'pending_review':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            <AlertCircle size={12} />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
            <XCircle size={12} />
            Rejected
          </span>
        );
      case 'published':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
            <CheckCircle size={12} />
            Published
          </span>
        );
      default:
        return null;
    }
  };

  if (!isTeams) {
    router.push('/workspace');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-black">
        <PageHeader title="Workspace" backHref="/workspace" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Workspace not found'}</h2>
          <Link href="/workspace" className="text-emerald-400 hover:underline">
            Back to workspaces
          </Link>
        </div>
      </div>
    );
  }

  const canManage = workspace.isOwner || workspace.role === 'admin';

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title={workspace.name} backHref="/workspace" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{workspace.name}</h1>
            <div className="flex items-center gap-3">
              {workspace.isOwner ? (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                  Owner
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full capitalize">
                  {workspace.role}
                </span>
              )}
              <span className="text-sm text-gray-400">
                {workspace.memberCount} members
              </span>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <UserPlus size={18} />
                Invite
              </button>
              {workspace.isOwner && (
                <button
                  onClick={handleDeleteWorkspace}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                  title="Delete workspace"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Members Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={20} />
              Members
            </h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {workspace.members.map((member, idx) => (
              <div
                key={member.id}
                className={clsx(
                  'flex items-center justify-between p-4',
                  idx !== workspace.members.length - 1 && 'border-b border-gray-800'
                )}
              >
                <div className="flex items-center gap-3">
                  {member.identity.profiles[0]?.avatarUrl ? (
                    <img
                      src={member.identity.profiles[0].avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400">
                        {member.identity.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {member.identity.profiles[0]?.displayName ||
                        member.identity.profiles[0]?.username ||
                        member.identity.email}
                    </p>
                    <p className="text-sm text-gray-400">{member.identity.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {member.isPending && (
                    <span className="text-xs text-yellow-400">Pending invite</span>
                  )}
                  <span
                    className={clsx(
                      'px-2 py-1 text-xs rounded-full capitalize',
                      member.isOwner
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : member.role === 'admin'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-gray-300'
                    )}
                  >
                    {member.isOwner ? 'Owner' : member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Drafts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={20} />
              Recent Drafts
            </h2>
            <Link
              href={`/workspace/${workspaceId}/drafts`}
              className="text-sm text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight size={16} />
            </Link>
          </div>

          {workspace.recentDrafts.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 border border-gray-800 rounded-xl">
              <FileText size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400">No drafts yet</p>
              <Link
                href={`/workspace/${workspaceId}/drafts/new`}
                className="inline-block mt-4 text-emerald-400 hover:underline"
              >
                Create your first draft
              </Link>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {workspace.recentDrafts.map((draft, idx) => (
                <Link
                  key={draft.id}
                  href={`/workspace/${workspaceId}/drafts/${draft.id}`}
                  className={clsx(
                    'flex items-center justify-between p-4 hover:bg-gray-800/50 transition',
                    idx !== workspace.recentDrafts.length - 1 && 'border-b border-gray-800'
                  )}
                >
                  <div>
                    <p className="text-white font-medium">
                      {draft.headline || `Untitled ${draft.contentType}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      by {draft.author?.displayName || draft.author?.username || 'Unknown'}
                    </p>
                  </div>
                  {getStatusBadge(draft.status)}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Member</h3>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="editor">Editor - Can create and edit drafts</option>
                    <option value="publisher">Publisher - Can approve and publish</option>
                    <option value="analyst">Analyst - View only</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>
              </div>

              {inviteError && (
                <p className="text-red-400 text-sm mt-3">{inviteError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {inviting && <Loader2 size={16} className="animate-spin" />}
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteError(null);
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
