'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Clock, ChevronRight, Filter } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface ChildSummary {
  id: string;
  username: string;
  display_name: string;
  avatar_id: string;
}

interface Conversation {
  id: string;
  child_a: ChildSummary;
  child_b: ChildSummary;
  created_at: string;
  messageCount: number;
  pendingCount: number;
  lastMessage: {
    content: string | null;
    type: string;
    created_at: string;
    status: string;
  } | null;
}

interface PaginatedResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminConversations() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPending, setHasPending] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (hasPending) params.set('hasPending', 'true');

        const response = await fetch(`/api/admin/conversations?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load conversations');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [hasPending, page]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    if (conversation.lastMessage.type === 'emoji') return conversation.lastMessage.content;
    if (conversation.lastMessage.type === 'voice') return '🎤 Voice message';
    return conversation.lastMessage.content || 'No content';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Conversations</h1>
        <div className="text-sm text-gray-400">
          {data?.total || 0} total
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setHasPending(!hasPending);
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasPending
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Filter size={16} />
          {hasPending ? 'Showing Pending Only' : 'Show Pending Only'}
        </button>
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
          {data.conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/admin/conversations/${conversation.id}`}
              className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              {/* Avatars */}
              <div className="flex -space-x-2">
                <Avatar avatarId={conversation.child_a.avatar_id} size="md" />
                <Avatar avatarId={conversation.child_b.avatar_id} size="md" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium truncate">
                    {conversation.child_a.display_name} & {conversation.child_b.display_name}
                  </h3>
                  {conversation.pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      {conversation.pendingCount} pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  @{conversation.child_a.username} · @{conversation.child_b.username}
                </p>
                <p className="text-sm text-gray-400 truncate mt-1">
                  {getMessagePreview(conversation)}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  {conversation.messageCount}
                </span>
                {conversation.lastMessage && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(conversation.lastMessage.created_at)}
                  </span>
                )}
              </div>

              <ChevronRight
                size={20}
                className="text-gray-600 group-hover:text-gray-400 transition-colors"
              />
            </Link>
          ))}
          {data.conversations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No conversations found
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
