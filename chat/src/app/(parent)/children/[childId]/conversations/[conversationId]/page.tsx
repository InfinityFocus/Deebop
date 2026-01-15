'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface Message {
  id: string;
  type: 'text' | 'emoji' | 'voice';
  content: string | null;
  mediaKey: string | null;
  mediaDuration: number | null;
  status: 'pending' | 'pending_recipient' | 'approved' | 'delivered' | 'denied';
  createdAt: string;
  isFromChild: boolean;
  senderName: string;
  senderAvatar: string;
}

interface ConversationDetails {
  id: string;
  childId: string;
  childName: string;
  childAvatar: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
}

export default function ConversationMonitorPage() {
  const params = useParams();
  const childId = params.childId as string;
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/parent/children/${childId}/conversations/${conversationId}`
      );
      const data = await response.json();

      if (data.success) {
        setConversation(data.data.conversation);
        setMessages(data.data.messages);
      } else {
        setError(data.error || 'Failed to load conversation');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [childId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400">
            <Clock size={12} />
            <span className="text-xs">Pending sender approval</span>
          </span>
        );
      case 'pending_recipient':
        return (
          <span className="flex items-center gap-1 text-blue-400">
            <Clock size={12} />
            <span className="text-xs">Pending recipient approval</span>
          </span>
        );
      case 'delivered':
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-primary-400">
            <CheckCircle size={12} />
            <span className="text-xs">Delivered</span>
          </span>
        );
      case 'denied':
        return (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={12} />
            <span className="text-xs">Denied</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
          <p className="text-red-400">{error || 'Conversation not found'}</p>
          <Link
            href={`/children/${childId}/conversations`}
            className="text-primary-400 hover:text-primary-300 mt-2 inline-block"
          >
            Back to Conversations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/children/${childId}/conversations`}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex -space-x-2">
            <Avatar avatarId={conversation.childAvatar} size="sm" />
            <Avatar avatarId={conversation.friendAvatar} size="sm" />
          </div>
          <div>
            <p className="text-white font-semibold">
              {conversation.childName} & {conversation.friendName}
            </p>
            <p className="text-sm text-gray-500">Conversation Monitor</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-3 mb-4">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Message from:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
            {conversation.childName}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            {conversation.friendName}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No messages in this conversation yet
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.status === 'denied' ? 'opacity-50' : ''
                }`}
              >
                <Avatar avatarId={message.senderAvatar} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-medium ${
                        message.isFromChild ? 'text-primary-400' : 'text-gray-300'
                      }`}
                    >
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.isFromChild
                        ? 'bg-primary-500/10 border border-primary-500/20'
                        : 'bg-dark-700 border border-dark-600'
                    }`}
                  >
                    {message.type === 'emoji' ? (
                      <span className="text-2xl">{message.content}</span>
                    ) : message.type === 'voice' ? (
                      <span className="text-gray-400 text-sm">
                        Voice message
                        {message.mediaDuration && ` (${Math.round(message.mediaDuration)}s)`}
                      </span>
                    ) : (
                      <p className="text-white text-sm">{message.content}</p>
                    )}
                  </div>
                  <div className="mt-1">{getStatusIcon(message.status)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-sm">
          This is a read-only view of the conversation. Messages pending approval will be
          shown in your{' '}
          <Link href="/approvals" className="underline hover:text-blue-300">
            Approvals
          </Link>{' '}
          page.
        </p>
      </div>
    </div>
  );
}
