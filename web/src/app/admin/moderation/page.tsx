'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Flag, CheckCircle, XCircle, AlertTriangle, Trash2, Ban, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface Report {
  id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'action_taken';
  moderator_notes: string | null;
  created_at: string;
  reporter: {
    id: string;
    username: string;
    email: string;
  };
  post: {
    id: string;
    content_type: string;
    text_content: string | null;
    media_url: string | null;
    author: {
      id: string;
      username: string;
      email: string;
    };
  };
}

async function fetchReports(status: string): Promise<{ reports: Report[] }> {
  const res = await fetch(`/api/admin/reports?status=${status}`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', statusFilter],
    queryFn: () => fetchReports(statusFilter),
  });

  const takeAction = useMutation({
    mutationFn: async ({ reportId, action, notes }: { reportId: string; action: string; notes: string }) => {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, moderatorNotes: notes }),
      });
      if (!res.ok) throw new Error('Failed to take action');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReport(null);
      setModeratorNotes('');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-400';
      case 'action_taken':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        Failed to load reports. Make sure you are an admin.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Flag className="text-red-400" aria-hidden="true" />
            Moderation Queue
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Review and take action on reported content</p>
        </div>

        {/* Status Filter */}
        <nav aria-label="Report status filters">
          <div className="flex flex-wrap gap-2">
            {['pending', 'reviewed', 'action_taken', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded-lg capitalize transition text-sm sm:text-base min-h-[44px]',
                  statusFilter === status
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
                aria-pressed={statusFilter === status}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Reports List */}
      {data?.reports.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">All Clear!</h2>
          <p className="text-gray-400">No {statusFilter !== 'all' ? statusFilter.replace('_', ' ') : ''} reports to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('px-2 py-1 rounded-full text-xs capitalize', getStatusBadge(report.status))}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-white font-medium">
                      Reason: <span className="text-red-400">{report.reason}</span>
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                    <span>Post by</span>
                    <span className="text-white font-medium">@{report.post.author.username}</span>
                    <span>({report.post.author.email})</span>
                  </div>
                  {report.post.text_content && (
                    <p className="text-white mb-2">{report.post.text_content}</p>
                  )}
                  {report.post.media_url && (
                    <div className="mt-2">
                      {report.post.content_type === 'video' ? (
                        <video
                          src={report.post.media_url}
                          controls
                          className="max-h-48 rounded-lg"
                        />
                      ) : (
                        <img
                          src={report.post.media_url}
                          alt=""
                          className="max-h-48 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Reporter Info */}
                <div className="text-sm text-gray-400 mb-4">
                  Reported by <span className="text-white">@{report.reporter.username}</span>
                </div>

                {/* Moderator Notes (if reviewed) */}
                {report.moderator_notes && (
                  <div className="bg-gray-900 rounded-lg p-3 mb-4 border-l-4 border-emerald-500">
                    <p className="text-sm text-gray-400">Moderator notes:</p>
                    <p className="text-white">{report.moderator_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Moderation actions">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm sm:text-base min-h-[44px]"
                      aria-label="Review report with notes"
                    >
                      <MessageSquare size={16} aria-hidden="true" />
                      <span className="hidden xs:inline">Review</span>
                    </button>
                    <button
                      onClick={() => takeAction.mutate({
                        reportId: report.id,
                        action: 'dismiss',
                        notes: 'No violation found',
                      })}
                      disabled={takeAction.isPending}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition text-sm sm:text-base min-h-[44px] disabled:opacity-50"
                      aria-label="Dismiss report - no violation found"
                    >
                      <CheckCircle size={16} aria-hidden="true" />
                      <span className="hidden xs:inline">Dismiss</span>
                    </button>
                    <button
                      onClick={() => takeAction.mutate({
                        reportId: report.id,
                        action: 'remove_post',
                        notes: 'Post removed for policy violation',
                      })}
                      disabled={takeAction.isPending}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition text-sm sm:text-base min-h-[44px] disabled:opacity-50"
                      aria-label="Remove reported post"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      <span className="hidden xs:inline">Remove</span>
                    </button>
                    <button
                      onClick={() => takeAction.mutate({
                        reportId: report.id,
                        action: 'suspend_user',
                        notes: 'User suspended for repeated violations',
                      })}
                      disabled={takeAction.isPending}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg transition text-sm sm:text-base min-h-[44px] disabled:opacity-50"
                      aria-label="Suspend post author"
                    >
                      <Ban size={16} aria-hidden="true" />
                      <span className="hidden xs:inline">Suspend</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 id="review-modal-title" className="text-xl font-bold text-white">Review Report</h2>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setModeratorNotes('');
                }}
                className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close review modal"
              >
                <XCircle size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="moderator-notes" className="block text-sm font-medium text-gray-300 mb-2">
                  Moderator Notes
                </label>
                <textarea
                  id="moderator-notes"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => takeAction.mutate({
                    reportId: selectedReport.id,
                    action: 'dismiss',
                    notes: moderatorNotes,
                  })}
                  disabled={takeAction.isPending}
                  className="py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  <CheckCircle size={20} aria-hidden="true" />
                  Dismiss
                </button>
                <button
                  onClick={() => takeAction.mutate({
                    reportId: selectedReport.id,
                    action: 'remove_post',
                    notes: moderatorNotes,
                  })}
                  disabled={takeAction.isPending}
                  className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  <Trash2 size={20} aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
