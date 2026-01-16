'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  Mic,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface ChildSummary {
  id: string;
  username: string;
  display_name: string;
  avatar_id: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: ChildSummary;
  recipient: ChildSummary;
  type: string;
  content: string | null;
  status: string;
  created_at: string;
}

interface PaginatedResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'text', label: 'Text' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'voice', label: 'Voice' },
];

export default function AdminMessages() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (type) params.set('type', type);

        const response = await fetch(`/api/admin/messages?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load messages');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchMessages, 300);
    return () => clearTimeout(debounce);
  }, [search, status, type, page]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (msgStatus: string) => {
    switch (msgStatus) {
      case 'approved':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'denied':
        return <XCircle size={14} className="text-red-400" />;
      case 'pending':
        return <AlertCircle size={14} className="text-yellow-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (msgStatus: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-400',
      denied: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[msgStatus] || 'bg-gray-500/20 text-gray-400';
  };

  const getMessagePreview = (message: Message) => {
    if (message.type === 'emoji') return message.content;
    if (message.type === 'voice') return '🎤 Voice message';
    return message.content || 'No content';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <div className="text-sm text-gray-400">{data?.total || 0} total</div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search message content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-cyan-500" size={32} />
        </div>
      )}

      {/* List */}
      {!isLoading && data && (
        <div className="space-y-3">
          {data.messages.map((message) => (
            <Link
              key={message.id}
              href={`/admin/conversations/${message.conversation_id}`}
              className="flex items-start gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              {/* Sender Avatar */}
              <Avatar avatarId={message.sender.avatar_id} size="md" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium">
                    {message.sender.display_name}
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="text-gray-400">{message.recipient.display_name}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusBadge(
                      message.status
                    )}`}
                  >
                    {getStatusIcon(message.status)}
                    {message.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  @{message.sender.username} → @{message.recipient.username}
                </p>
                <p className="text-gray-300 mt-2 line-clamp-2">
                  {message.type === 'voice' && <Mic size={14} className="inline mr-1" />}
                  {getMessagePreview(message)}
                </p>
              </div>

              {/* Time */}
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} />
                {formatTime(message.created_at)}
              </div>
            </Link>
          ))}
          {data.messages.length === 0 && (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-gray-600" />
              No messages found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-900 text-gray-300 rounded-lg border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 bg-gray-900 text-gray-300 rounded-lg border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
