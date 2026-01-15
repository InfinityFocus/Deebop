'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';
import { MessageInput } from '@/components/child/MessageInput';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: string;
  type: 'text' | 'emoji' | 'voice';
  content: string | null;
  mediaUrl: string | null;
  mediaDuration: number | null;
  status: 'pending' | 'approved' | 'delivered' | 'denied';
  createdAt: string;
  isFromMe: boolean;
}

interface ConversationDetails {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuthStore();

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
      const response = await fetch(`/api/child/conversations/${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setConversation(data.data.conversation);
        // Merge server messages with local state to preserve optimistic updates
        setMessages((prevMessages) => {
          const serverMessages: Message[] = data.data.messages;
          const serverMessageIds = new Set(serverMessages.map((m: Message) => m.id));

          // Keep optimistic messages that aren't yet on server
          const optimisticMessages = prevMessages.filter(
            (m) => !serverMessageIds.has(m.id)
          );

          // Combine: server messages take precedence, then optimistic ones at the end
          return [...serverMessages, ...optimisticMessages];
        });
      } else {
        setError(data.error || 'Failed to load chat');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Start polling for new messages
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (type: 'text' | 'emoji', content: string) => {
    try {
      const response = await fetch(`/api/child/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      });

      const data = await response.json();

      if (data.success) {
        // Add message optimistically
        setMessages((prev) => [
          ...prev,
          {
            id: data.data.id,
            type,
            content,
            mediaUrl: null,
            mediaDuration: null,
            status: data.data.status,
            createdAt: new Date().toISOString(),
            isFromMe: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading chat...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
          <p className="text-red-400">{error || 'Chat not found'}</p>
          <Link href="/chats" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
            Back to Chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-dark-700">
        <Link href="/chats" className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <Avatar avatarId={conversation.friendAvatar} size="md" />
        <div>
          <p className="text-white font-semibold">{conversation.friendName}</p>
          <p className="text-sm text-gray-500">@{conversation.friendUsername}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet!</p>
            <p className="text-sm mt-1">Say hi to {conversation.friendName} 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-dark-700">
        <MessageInput onSend={handleSendMessage} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isFromMe = message.isFromMe;

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] ${
          isFromMe
            ? 'bg-cyan-500 text-white rounded-l-xl rounded-tr-xl'
            : 'bg-dark-700 text-white rounded-r-xl rounded-tl-xl'
        } px-4 py-2`}
      >
        {message.type === 'emoji' ? (
          <span className="text-3xl">{message.content}</span>
        ) : message.type === 'voice' ? (
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <span className="text-sm">Voice message</span>
            {message.mediaDuration && (
              <span className="text-xs opacity-70">
                {Math.round(message.mediaDuration)}s
              </span>
            )}
          </div>
        ) : (
          <p>{message.content}</p>
        )}

        {/* Status indicator */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isFromMe ? 'text-cyan-200' : 'text-gray-500'
          }`}
        >
          {message.status === 'pending' && (
            <>
              <Clock size={12} />
              <span>Waiting for approval</span>
            </>
          )}
          {message.status === 'denied' && (
            <>
              <AlertCircle size={12} />
              <span>Not approved</span>
            </>
          )}
          {(message.status === 'delivered' || message.status === 'approved') && (
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
