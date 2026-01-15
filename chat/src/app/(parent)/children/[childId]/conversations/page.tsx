'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface LastMessage {
  content: string | null;
  type: string;
  createdAt: string;
  isFromChild: boolean;
  status: string;
}

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
  createdAt: string;
  messageCount: number;
  lastMessage: LastMessage | null;
}

export default function ChildConversationsPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [childName, setChildName] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch(`/api/parent/children/${childId}/conversations`);
        const data = await response.json();

        if (data.success) {
          setChildName(data.data.childName);
          setConversations(data.data.conversations);
        } else {
          setError(data.error || 'Failed to load conversations');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [childId]);

  const getStatusIndicator = (status: string) => {
    if (status === 'pending' || status === 'pending_recipient') {
      return (
        <span className="flex items-center gap-1 text-xs text-yellow-400">
          <Clock size={12} />
          Pending
        </span>
      );
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessagePreview = (message: LastMessage, childName: string) => {
    const prefix = message.isFromChild ? `${childName}: ` : '';

    if (message.type === 'emoji') {
      return `${prefix}${message.content}`;
    } else if (message.type === 'voice') {
      return `${prefix}Voice message`;
    } else {
      const content = message.content || '';
      const truncated = content.length > 40 ? content.substring(0, 40) + '...' : content;
      return `${prefix}${truncated}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/children/${childId}`} className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{childName}&apos;s Conversations</h1>
          <p className="text-gray-400">
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
          <MessageSquare className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-2">No conversations yet</p>
          <p className="text-sm text-gray-500">
            When {childName} starts chatting with friends, conversations will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/children/${childId}/conversations/${conv.id}`}
              className="block bg-dark-800 rounded-xl border border-dark-700 p-4 hover:bg-dark-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar avatarId={conv.friendAvatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">{conv.friendName}</p>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">
                      {conv.lastMessage
                        ? getMessagePreview(conv.lastMessage, childName)
                        : 'No messages yet'}
                    </p>
                    {conv.lastMessage && getStatusIndicator(conv.lastMessage.status)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 bg-dark-600 px-2 py-1 rounded-full">
                    {conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
