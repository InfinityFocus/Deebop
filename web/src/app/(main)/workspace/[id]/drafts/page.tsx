'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTierGate } from '@/hooks/useTierGate';
import { PageHeader } from '@/components/layout/PageHeader';

interface Draft {
  id: string;
  contentType: string;
  description: string | null;
  headline: string | null;
  mediaUrl: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

type StatusFilter = 'all' | 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

export default function WorkspaceDraftsPage() {
  const params = useParams();
  const router = useRouter();
  const { isTeams } = useTierGate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const workspaceId = params.id as string;

  useEffect(() => {
    if (!isTeams || !workspaceId) return;
    fetchDrafts();
  }, [isTeams, workspaceId, statusFilter]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? `/api/workspaces/${workspaceId}/drafts`
        : `/api/workspaces/${workspaceId}/drafts?status=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts);
      }
    } catch (err) {
      console.error('Fetch drafts error:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title="Drafts" backHref={`/workspace/${workspaceId}`} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Workspace Drafts</h1>
          <Link
            href={`/workspace/${workspaceId}/drafts/new`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
          >
            <Plus size={20} />
            New Draft
          </Link>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
          {(['all', 'draft', 'pending_review', 'approved', 'rejected', 'published'] as StatusFilter[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition',
                  statusFilter === filter
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                )}
              >
                {filter === 'all'
                  ? 'All'
                  : filter === 'pending_review'
                  ? 'Pending Review'
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Drafts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No drafts found</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter === 'all'
                ? 'Create your first draft to get started'
                : `No drafts with "${statusFilter.replace('_', ' ')}" status`}
            </p>
            {statusFilter === 'all' && (
              <Link
                href={`/workspace/${workspaceId}/drafts/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <Plus size={18} />
                Create Draft
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/workspace/${workspaceId}/drafts/${draft.id}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                        {draft.contentType}
                      </span>
                      {getStatusBadge(draft.status)}
                    </div>
                    <h3 className="text-white font-medium truncate">
                      {draft.headline || draft.description?.slice(0, 50) || `Untitled ${draft.contentType}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                      {draft.author && (
                        <span>by {draft.author.displayName || draft.author.username}</span>
                      )}
                      <span>
                        Updated {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {draft.reviewNotes && draft.status === 'rejected' && (
                      <p className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded">
                        Review notes: {draft.reviewNotes}
                      </p>
                    )}
                  </div>
                  {draft.mediaUrl && (
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      <img
                        src={draft.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
