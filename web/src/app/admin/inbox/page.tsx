'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Archive,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InboxResponse {
  messages: ContactMessage[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Support / Help',
  account: 'Account / Password',
  feedback: 'Feedback',
  bug: 'Bug Report',
  business: 'Business / Partnerships',
  privacy: 'Privacy Concerns',
  legal: 'Legal',
  careers: 'Careers',
  other: 'Other',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  unread: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  read: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  replied: { bg: 'bg-green-500/20', text: 'text-green-400' },
  archived: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
};

async function fetchInbox(page: number, status: string): Promise<InboxResponse> {
  const res = await fetch(`/api/admin/inbox?page=${page}&status=${status}`);
  if (!res.ok) throw new Error('Failed to fetch inbox');
  return res.json();
}

export default function AdminInboxPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-inbox', page, statusFilter],
    queryFn: () => fetchInbox(page, statusFilter),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const res = await fetch(`/api/admin/inbox/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inbox'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/inbox/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inbox'] });
      setSelectedMessage(null);
    },
  });

  const handleOpenMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setNotes(message.notes || '');
    // Mark as read if unread
    if (message.status === 'unread') {
      updateMutation.mutate({ id: message.id, status: 'read' });
    }
  };

  const handleStatusChange = (status: string) => {
    if (selectedMessage) {
      updateMutation.mutate({ id: selectedMessage.id, status });
      setSelectedMessage({ ...selectedMessage, status: status as any });
    }
  };

  const handleSaveNotes = () => {
    if (selectedMessage) {
      updateMutation.mutate({ id: selectedMessage.id, notes });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) {
      return date.toLocaleDateString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Inbox className="text-emerald-400" />
            Inbox
          </h1>
          <p className="text-gray-400 mt-1">
            {data?.unreadCount ? `${data.unreadCount} unread messages` : 'Contact form messages'}
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'unread', 'read', 'replied', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition',
                statusFilter === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Message List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              Failed to load messages
            </div>
          ) : data?.messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <>
              {data?.messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleOpenMessage(message)}
                  className={clsx(
                    'w-full text-left p-4 rounded-xl border transition',
                    selectedMessage?.id === message.id
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700',
                    message.status === 'unread' && 'border-l-4 border-l-blue-500'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {message.status === 'unread' ? (
                        <Mail size={16} className="text-blue-400 flex-shrink-0" />
                      ) : (
                        <MailOpen size={16} className="text-gray-500 flex-shrink-0" />
                      )}
                      <span className={clsx(
                        'font-medium truncate',
                        message.status === 'unread' ? 'text-white' : 'text-gray-300'
                      )}>
                        {message.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 truncate">{message.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-full text-gray-400">
                      {subjectLabels[message.subject] || message.subject}
                    </span>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      statusColors[message.status].bg,
                      statusColors[message.status].text
                    )}>
                      {message.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{message.message}</p>
                </button>
              ))}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 rounded-lg disabled:opacity-50"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {selectedMessage ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {/* Message Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedMessage.name}</h2>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-sm text-emerald-400 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        deleteMutation.mutate(selectedMessage.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Tag size={12} />
                    {subjectLabels[selectedMessage.subject] || selectedMessage.subject}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {new Date(selectedMessage.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleStatusChange('read')}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition',
                      selectedMessage.status === 'read'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    <MailOpen size={14} /> Read
                  </button>
                  <button
                    onClick={() => handleStatusChange('replied')}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition',
                      selectedMessage.status === 'replied'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    <Reply size={14} /> Replied
                  </button>
                  <button
                    onClick={() => handleStatusChange('archived')}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition',
                      selectedMessage.status === 'archived'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    <Archive size={14} /> Archive
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-4 border-b border-gray-800">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {/* Reply via Email */}
              <div className="p-4 border-b border-gray-800">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${subjectLabels[selectedMessage.subject] || selectedMessage.subject}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
                >
                  <Reply size={18} />
                  Reply via Email
                </a>
              </div>

              {/* Notes */}
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this message..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending}
                  className="mt-2 px-4 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
