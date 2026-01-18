'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Music,
  MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTierGate } from '@/hooks/useTierGate';
import { useAuth } from '@/hooks/useAuth';
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
  reviewer: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

interface MemberInfo {
  role: string;
  isOwner: boolean;
}

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isTeams } = useTierGate();

  const workspaceId = params.id as string;
  const draftId = params.draftId as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (!isTeams || !workspaceId || !draftId) return;
    fetchDraft();
    fetchMemberInfo();
  }, [isTeams, workspaceId, draftId]);

  const fetchDraft = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/drafts/${draftId}`);
      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft);
        setEditHeadline(data.draft.headline || '');
        setEditDescription(data.draft.description || '');
      } else if (res.status === 404) {
        setError('Draft not found');
      } else {
        setError('Failed to load draft');
      }
    } catch (err) {
      console.error('Fetch draft error:', err);
      setError('Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberInfo = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setMemberInfo({
          role: data.workspace.role,
          isOwner: data.workspace.isOwner,
        });
      }
    } catch (err) {
      console.error('Fetch member info error:', err);
    }
  };

  const performAction = async (action: string, data?: Record<string, string>) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (res.ok) {
        const responseData = await res.json();
        setDraft(responseData.draft);

        if (action === 'publish') {
          router.push(`/workspace/${workspaceId}/drafts`);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || `Failed to ${action}`);
      }
    } catch (err) {
      console.error(`Action ${action} error:`, err);
      alert(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    setActionLoading('save');
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          headline: editHeadline.trim() || null,
          description: editDescription.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDraft(data.draft);
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Save edit error:', err);
      alert('Failed to save changes');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    setActionLoading('delete');
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push(`/workspace/${workspaceId}/drafts`);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to delete draft');
      }
    } catch (err) {
      console.error('Delete draft error:', err);
      alert('Failed to delete draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async () => {
    await performAction(reviewAction, {
      reviewNotes: reviewNotes.trim() || undefined,
    } as any);
    setShowReviewModal(false);
    setReviewNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded-full">
            <Clock size={16} />
            Draft
          </span>
        );
      case 'pending_review':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
            <AlertCircle size={16} />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 text-sm rounded-full">
            <CheckCircle size={16} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-full">
            <XCircle size={16} />
            Rejected
          </span>
        );
      case 'published':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
            <CheckCircle size={16} />
            Published
          </span>
        );
      default:
        return null;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'shout':
        return <MessageSquare size={18} />;
      case 'image':
        return <ImageIcon size={18} />;
      case 'video':
        return <Video size={18} />;
      case 'audio':
        return <Music size={18} />;
      default:
        return null;
    }
  };

  const canEdit =
    draft?.status === 'draft' ||
    draft?.status === 'rejected';

  const canSubmitForReview = draft?.status === 'draft' || draft?.status === 'rejected';

  const canReview =
    draft?.status === 'pending_review' &&
    memberInfo &&
    (memberInfo.isOwner || memberInfo.role === 'admin' || memberInfo.role === 'publisher');

  const canPublish =
    draft?.status === 'approved' &&
    memberInfo &&
    (memberInfo.isOwner || memberInfo.role === 'admin' || memberInfo.role === 'publisher');

  const canDelete =
    memberInfo &&
    (memberInfo.isOwner ||
      memberInfo.role === 'admin' ||
      draft?.author?.id === user?.id);

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

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-black">
        <PageHeader title="Draft" backHref={`/workspace/${workspaceId}/drafts`} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Draft not found'}</h2>
          <Link href={`/workspace/${workspaceId}/drafts`} className="text-emerald-400 hover:underline">
            Back to drafts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title="Draft" backHref={`/workspace/${workspaceId}/drafts`} />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-gray-300 rounded-lg capitalize">
              {getContentTypeIcon(draft.contentType)}
              {draft.contentType}
            </span>
            {getStatusBadge(draft.status)}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                <Edit3 size={16} />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
              >
                {actionLoading === 'delete' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Draft Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="Add a headline..."
                  maxLength={100}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === 'save'}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
                >
                  {actionLoading === 'save' && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditHeadline(draft.headline || '');
                    setEditDescription(draft.description || '');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {draft.headline && (
                <h2 className="text-xl font-bold text-white mb-3">{draft.headline}</h2>
              )}
              {draft.description ? (
                <p className="text-gray-300 whitespace-pre-wrap">{draft.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description</p>
              )}
            </>
          )}

          {/* Media Preview */}
          {draft.mediaUrl && (
            <div className="mt-4">
              {draft.contentType === 'image' && (
                <img
                  src={draft.mediaUrl}
                  alt=""
                  className="max-w-full max-h-96 rounded-lg object-contain bg-gray-800"
                />
              )}
              {draft.contentType === 'video' && (
                <video
                  src={draft.mediaUrl}
                  controls
                  className="max-w-full max-h-96 rounded-lg bg-gray-800"
                />
              )}
              {draft.contentType === 'audio' && (
                <audio src={draft.mediaUrl} controls className="w-full" />
              )}
            </div>
          )}
        </div>

        {/* Review Notes */}
        {draft.reviewNotes && (draft.status === 'rejected' || draft.status === 'approved') && (
          <div
            className={clsx(
              'p-4 rounded-lg mb-6',
              draft.status === 'rejected'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-green-500/10 border border-green-500/30'
            )}
          >
            <p className={clsx('text-sm font-medium mb-1', draft.status === 'rejected' ? 'text-red-400' : 'text-green-400')}>
              {draft.status === 'rejected' ? 'Rejection Notes' : 'Approval Notes'}
            </p>
            <p className="text-gray-300">{draft.reviewNotes}</p>
            {draft.reviewer && (
              <p className="text-sm text-gray-500 mt-2">
                — {draft.reviewer.displayName || draft.reviewer.username}
              </p>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
          {draft.author && (
            <span>
              Author: {draft.author.displayName || draft.author.username}
            </span>
          )}
          <span>Created: {new Date(draft.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(draft.updatedAt).toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canSubmitForReview && (
            <button
              onClick={() => performAction('submit_for_review')}
              disabled={actionLoading === 'submit_for_review'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-medium rounded-lg transition"
            >
              {actionLoading === 'submit_for_review' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {draft.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
            </button>
          )}

          {canReview && (
            <>
              <button
                onClick={() => {
                  setReviewAction('approve');
                  setShowReviewModal(true);
                }}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                <CheckCircle size={18} />
                Approve
              </button>
              <button
                onClick={() => {
                  setReviewAction('reject');
                  setShowReviewModal(true);
                }}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                <XCircle size={18} />
                Reject
              </button>
            </>
          )}

          {canPublish && (
            <button
              onClick={() => performAction('publish')}
              disabled={actionLoading === 'publish'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition"
            >
              {actionLoading === 'publish' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Publish Now
            </button>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {reviewAction === 'approve' ? 'Approve Draft' : 'Reject Draft'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Notes <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any approval notes...'
                    : 'Explain why this draft is being rejected...'
                }
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReview}
                disabled={actionLoading !== null}
                className={clsx(
                  'flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2',
                  reviewAction === 'approve'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
