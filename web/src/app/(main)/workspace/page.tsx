'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, Plus, Settings, Loader2, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useTierGate } from '@/hooks/useTierGate';
import { PageHeader } from '@/components/layout/PageHeader';

interface Workspace {
  id: string;
  name: string;
  isOwner: boolean;
  role?: string;
  memberCount: number;
  draftCount: number;
  createdAt: string;
}

interface WorkspacesData {
  owned: Workspace[];
  member: Workspace[];
}

export default function WorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isTeams } = useTierGate();
  const [workspaces, setWorkspaces] = useState<WorkspacesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTeams) {
      return;
    }
    fetchWorkspaces();
  }, [isTeams]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkspaces((prev) => prev ? {
          ...prev,
          owned: [data.workspace, ...prev.owned],
        } : null);
        setNewWorkspaceName('');
        setShowCreateForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create workspace');
      }
    } catch (err) {
      console.error('Create workspace error:', err);
      setError('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  // Show upgrade prompt for non-Teams users
  if (!isTeams) {
    return (
      <div className="min-h-screen bg-black">
        <PageHeader title="Workspace" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center mb-6">
            <Crown size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Workspaces require Teams tier
          </h2>
          <p className="text-gray-400 mb-8">
            Collaborate with your team using workspaces. Create drafts, assign roles,
            and manage publishing workflows together.
          </p>
          <Link
            href="/settings/subscription"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Upgrade to Teams
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const allWorkspaces = [
    ...(workspaces?.owned || []),
    ...(workspaces?.member || []),
  ];

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title="Workspace" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Workspace Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Your Workspaces</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
          >
            <Plus size={20} />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWorkspace}>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={creating || !newWorkspaceName.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspaces List */}
        {allWorkspaces.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <Users size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No workspaces yet</h3>
            <p className="text-gray-400 mb-6">
              Create a workspace to start collaborating with your team
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {allWorkspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="block p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {workspace.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {workspace.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={14} />
                        {workspace.draftCount} drafts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workspace.isOwner ? (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Owner
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full capitalize">
                        {workspace.role}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
