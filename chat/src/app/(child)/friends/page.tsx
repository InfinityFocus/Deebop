'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Users, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';
import type { PresenceStatus } from '@/types';

interface Friend {
  id: string;
  childId: string;
  displayName: string;
  username: string;
  avatarId: string;
  conversationId: string | null;
  status: 'approved' | 'pending';
  presenceStatus: PresenceStatus;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const response = await fetch('/api/child/friends');
        const data = await response.json();

        if (data.success) {
          const approved = data.data.filter((f: Friend) => f.status === 'approved');
          const pending = data.data.filter((f: Friend) => f.status === 'pending');
          setFriends(approved);
          setPendingRequests(pending);
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriends();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Friends</h1>
        <Link href="/friends/add">
          <Button size="sm">
            <UserPlus size={16} className="mr-1" />
            Add Friend
          </Button>
        </Link>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-yellow-400" />
            <h2 className="font-semibold text-yellow-400">Waiting for Approval</h2>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg"
              >
                <Avatar avatarId={request.avatarId} size="sm" />
                <div className="flex-1">
                  <p className="text-white font-medium">{request.displayName}</p>
                  <p className="text-sm text-gray-500">@{request.username}</p>
                </div>
                <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
                  Pending
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Your parent needs to approve these friend requests
          </p>
        </div>
      )}

      {/* Friends List */}
      {friends.length === 0 && pendingRequests.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No friends yet</h2>
          <p className="text-gray-400 text-sm mb-4">
            Add friends to start chatting!
          </p>
          <Link href="/friends/add">
            <Button>
              <UserPlus size={18} className="mr-2" />
              Add Your First Friend
            </Button>
          </Link>
        </div>
      ) : friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-3">
        <Avatar avatarId={friend.avatarId} size="md" status={friend.presenceStatus} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium">{friend.displayName}</p>
          <p className="text-sm text-gray-500">@{friend.username}</p>
        </div>
        {friend.conversationId ? (
          <Link href={`/chat/${friend.conversationId}`}>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
              <MessageCircle size={16} className="mr-1" />
              Chat
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" disabled>
            <AlertCircle size={16} className="mr-1" />
            No Chat
          </Button>
        )}
      </div>
    </div>
  );
}
