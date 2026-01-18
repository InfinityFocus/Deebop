'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle, Clock } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';
import { TimeoutBanner } from '@/components/child/TimeoutBanner';
import { TimeoutOverlay } from '@/components/child/TimeoutOverlay';
import type { Timeout, TimeoutReason, PresenceStatus } from '@/types';

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
  friendStatus: PresenceStatus;
  lastMessage: {
    content: string | null;
    type: 'text' | 'emoji' | 'voice';
    createdAt: string;
    isFromMe: boolean;
    status: 'pending' | 'approved' | 'delivered' | 'denied';
  } | null;
  unreadCount: number;
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Timeout state - only check for global timeouts (conversation_id = null)
  const [globalTimeout, setGlobalTimeout] = useState<Timeout | null>(null);
  const [upcomingTimeout, setUpcomingTimeout] = useState<Timeout | null>(null);

  // Fetch timeout status
  const fetchTimeoutStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/child/timeouts');
      const data = await response.json();

      if (data.success) {
        // Only set if it's a global timeout
        const active = data.data.activeTimeout;
        const upcoming = data.data.upcomingTimeout;
        setGlobalTimeout(active?.conversationId === null ? active : null);
        setUpcomingTimeout(upcoming?.conversationId === null ? upcoming : null);
      }
    } catch (err) {
      console.error('Failed to fetch timeout status:', err);
    }
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch('/api/child/conversations');
        const data = await response.json();

        if (data.success) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
    fetchTimeoutStatus();

    // Poll for timeout status
    const interval = setInterval(fetchTimeoutStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchTimeoutStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading chats...</div>
      </div>
    );
  }

  const showCountdownBanner = !!upcomingTimeout && !globalTimeout;

  return (
    <>
      {/* Global Timeout Overlay */}
      {globalTimeout && (
        <TimeoutOverlay
          endAt={globalTimeout.endAt}
          reason={globalTimeout.reason as TimeoutReason | null}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-xl font-bold text-white">Chats</h1>

        {/* Global Countdown Banner */}
        {showCountdownBanner && (
          <TimeoutBanner
            endAt={upcomingTimeout.endAt}
            startAt={upcomingTimeout.startAt}
            reason={upcomingTimeout.reason as TimeoutReason | null}
            isCountdown={true}
          />
        )}

        {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No chats yet</h2>
          <p className="text-gray-400 text-sm mb-4">
            Add some friends to start chatting!
          </p>
          <Link
            href="/friends/add"
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Find Friends →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
      </div>
    </>
  );
}

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const lastMessage = conversation.lastMessage;

  const getMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';

    if (lastMessage.status === 'pending') {
      return lastMessage.isFromMe
        ? '⏳ Waiting for parent approval...'
        : '🔔 New message!';
    }

    if (lastMessage.status === 'denied') {
      return '❌ Message not approved';
    }

    if (lastMessage.type === 'voice') {
      return '🎤 Voice message';
    }

    if (lastMessage.type === 'emoji') {
      return lastMessage.content || '😊';
    }

    return lastMessage.content || 'Message';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/chat/${conversation.id}`}>
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 hover:border-cyan-500/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar avatarId={conversation.friendAvatar} size="md" status={conversation.friendStatus} />
            {conversation.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {conversation.unreadCount}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{conversation.friendName}</p>
              {lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatTime(lastMessage.createdAt)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">
              {lastMessage?.isFromMe && (
                <span className="text-gray-500">You: </span>
              )}
              {getMessagePreview()}
            </p>
          </div>

          {lastMessage?.status === 'pending' && lastMessage.isFromMe && (
            <Clock size={16} className="text-yellow-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </Link>
  );
}
