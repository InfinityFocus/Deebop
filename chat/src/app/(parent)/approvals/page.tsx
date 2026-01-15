'use client';

import { useEffect, useState } from 'react';
import { Users, MessageCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';
import { useAuthStore } from '@/stores/authStore';

interface FriendRequest {
  id: string;
  childId: string;
  childName: string;
  childAvatar: string;
  friendChildId: string;
  friendName: string;
  friendAvatar: string;
  requestedAt: string;
  requestType: 'outgoing' | 'incoming';
  yourChildId: string;
  yourChildName: string;
  otherChildName: string;
}

interface PendingMessage {
  id: string;
  conversationId: string;
  senderChildId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string | null;
  recipientName: string;
  recipientAvatar: string;
  type: 'text' | 'emoji' | 'voice';
  content: string | null;
  createdAt: string;
  messageType: 'outgoing' | 'incoming';
  yourChildId: string | null;
  yourChildName: string;
  otherChildName: string;
}

export default function ApprovalsPage() {
  const { setPendingCount } = useAuthStore();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/parent/approvals');
      const data = await response.json();

      if (data.success) {
        setFriendRequests(data.data.friendRequests);
        setMessages(data.data.messages);
        setPendingCount(data.data.friendRequests.length + data.data.messages.length);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleFriendRequest = async (id: string, action: 'approve' | 'deny') => {
    setProcessingIds((prev) => new Set(prev).add(`friend-${id}`));
    setError(null);

    try {
      const response = await fetch(`/api/parent/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'friend_request', action }),
      });

      const data = await response.json();

      if (data.success) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== id));
        setPendingCount((c) => Math.max(0, c - 1));
      } else {
        setError(data.error || 'Failed to process friend request');
        console.error('Friend request error:', data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Failed to process friend request:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(`friend-${id}`);
        return next;
      });
    }
  };

  const handleMessage = async (id: string, action: 'approve' | 'deny') => {
    setProcessingIds((prev) => new Set(prev).add(`message-${id}`));
    setError(null);

    try {
      const response = await fetch(`/api/parent/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', action }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setPendingCount((c) => Math.max(0, c - 1));
      } else {
        setError(data.error || 'Failed to process message');
        console.error('Message error:', data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Failed to process message:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(`message-${id}`);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalPending = friendRequests.length + messages.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Approvals</h1>
        <p className="text-gray-400">
          Review and approve friend requests and messages
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}

      {totalPending === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">All caught up!</h2>
          <p className="text-gray-400">
            There are no pending approvals at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  Friend Requests ({friendRequests.length})
                </h2>
              </div>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    onApprove={() => handleFriendRequest(request.id, 'approve')}
                    onDeny={() => handleFriendRequest(request.id, 'deny')}
                    isProcessing={processingIds.has(`friend-${request.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Messages */}
          {messages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={20} className="text-primary-400" />
                <h2 className="text-lg font-semibold text-white">
                  Pending Messages ({messages.length})
                </h2>
              </div>
              <div className="space-y-3">
                {messages.map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    onApprove={() => handleMessage(message.id, 'approve')}
                    onDeny={() => handleMessage(message.id, 'deny')}
                    isProcessing={processingIds.has(`message-${message.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FriendRequestCard({
  request,
  onApprove,
  onDeny,
  isProcessing,
}: {
  request: FriendRequest;
  onApprove: () => void;
  onDeny: () => void;
  isProcessing: boolean;
}) {
  const isOutgoing = request.requestType === 'outgoing';

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar avatarId={request.childAvatar} size="md" />
          <span className="text-gray-500">→</span>
          <Avatar avatarId={request.friendAvatar} size="md" />
        </div>

        <div className="flex-1 min-w-0">
          {isOutgoing ? (
            <p className="text-white">
              <span className="font-semibold text-primary-400">{request.yourChildName}</span>
              <span className="text-gray-400"> wants to add </span>
              <span className="font-semibold">{request.otherChildName}</span>
              <span className="text-gray-400"> as a friend</span>
            </p>
          ) : (
            <p className="text-white">
              <span className="font-semibold">{request.otherChildName}</span>
              <span className="text-gray-400"> wants to add </span>
              <span className="font-semibold text-primary-400">{request.yourChildName}</span>
              <span className="text-gray-400"> as a friend</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {isOutgoing ? 'Approve to send request' : 'Incoming request'} · {new Date(request.requestedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDeny}
            disabled={isProcessing}
          >
            <XCircle size={16} className="mr-1" />
            Deny
          </Button>
          <Button size="sm" onClick={onApprove} isLoading={isProcessing}>
            <CheckCircle size={16} className="mr-1" />
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageCard({
  message,
  onApprove,
  onDeny,
  isProcessing,
}: {
  message: PendingMessage;
  onApprove: () => void;
  onDeny: () => void;
  isProcessing: boolean;
}) {
  const isOutgoing = message.messageType === 'outgoing';

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-start gap-4">
        <Avatar avatarId={message.senderAvatar} size="md" />

        <div className="flex-1 min-w-0">
          <p className="text-white mb-1">
            {isOutgoing ? (
              <>
                <span className="font-semibold text-primary-400">{message.yourChildName}</span>
                <span className="text-gray-400"> → </span>
                <span className="font-semibold">{message.otherChildName}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">{message.otherChildName}</span>
                <span className="text-gray-400"> → </span>
                <span className="font-semibold text-primary-400">{message.yourChildName}</span>
              </>
            )}
          </p>

          {message.type === 'text' && (
            <div className="bg-dark-700 rounded-lg p-3 text-gray-300">
              {message.content}
            </div>
          )}

          {message.type === 'emoji' && (
            <div className="text-3xl">{message.content}</div>
          )}

          {message.type === 'voice' && (
            <div className="flex items-center gap-2 bg-dark-700 rounded-lg p-3">
              <AlertCircle size={16} className="text-gray-500" />
              <span className="text-gray-400 text-sm">Voice message</span>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {isOutgoing ? 'Outgoing message' : 'Incoming message'} · {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDeny}
            disabled={isProcessing}
          >
            <XCircle size={16} />
          </Button>
          <Button size="sm" onClick={onApprove} isLoading={isProcessing}>
            <CheckCircle size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
