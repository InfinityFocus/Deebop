'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Mic } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface ChildSummary {
  id: string;
  username: string;
  display_name: string;
  avatar_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  type: string;
  content: string | null;
  voice_url: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

interface ConversationDetail {
  id: string;
  child_a: ChildSummary;
  child_b: ChildSummary;
  created_at: string;
  messages: Message[];
}

export default function AdminConversationDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConversation() {
      try {
        const response = await fetch(`/api/admin/conversations/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load conversation');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchConversation();
    }
  }, [params.id]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-400',
      denied: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getSenderInfo = (senderId: string) => {
    if (!data) return null;
    if (senderId === data.child_a.id) return data.child_a;
    if (senderId === data.child_b.id) return data.child_b;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Conversations
        </button>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Conversations
        </button>
        <div className="text-center py-12 text-gray-500">Conversation not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/conversations"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar avatarId={data.child_a.avatar_id} size="md" />
            <Avatar avatarId={data.child_b.avatar_id} size="md" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {data.child_a.display_name} & {data.child_b.display_name}
            </h1>
            <p className="text-sm text-gray-500">
              @{data.child_a.username} · @{data.child_b.username}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-400">
        <span>{data.messages.length} messages</span>
        <span>Started {formatTime(data.created_at)}</span>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {data.messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No messages in this conversation</div>
        ) : (
          data.messages.map((message) => {
            const sender = getSenderInfo(message.sender_id);
            const isChildA = message.sender_id === data.child_a.id;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isChildA ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar avatarId={sender?.avatar_id || 'bear'} size="sm" />
                </div>

                {/* Message */}
                <div className={`flex-1 max-w-[70%] ${isChildA ? '' : 'flex flex-col items-end'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400">{sender?.display_name}</span>
                    <span className="text-xs text-gray-600">{formatTime(message.created_at)}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-3 ${
                      isChildA
                        ? 'bg-gray-800 rounded-tl-sm'
                        : 'bg-cyan-600/20 rounded-tr-sm'
                    }`}
                  >
                    {message.type === 'voice' ? (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mic size={16} />
                        <span>Voice message</span>
                        {message.voice_url && (
                          <audio controls className="h-8">
                            <source src={message.voice_url} type="audio/webm" />
                          </audio>
                        )}
                      </div>
                    ) : message.type === 'emoji' ? (
                      <span className="text-3xl">{message.content}</span>
                    ) : (
                      <p className="text-white">{message.content || 'No content'}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusBadge(
                        message.status
                      )}`}
                    >
                      {getStatusIcon(message.status)}
                      {message.status}
                    </span>
                    {message.reviewed_at && (
                      <span className="text-xs text-gray-600">
                        Reviewed {formatTime(message.reviewed_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
