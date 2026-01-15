'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Trash2, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';

interface Friend {
  id: string;
  friendshipId: string;
  username: string;
  displayName: string;
  avatarId: string;
  status: 'pending' | 'pending_recipient' | 'approved' | 'blocked';
  approvedAt: string | null;
  conversationId: string | null;
}

export default function ChildFriendsPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [childName, setChildName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const response = await fetch(`/api/parent/children/${childId}/friends`);
        const data = await response.json();

        if (data.success) {
          setChildName(data.data.childName);
          setFriends(data.data.friends);
        } else {
          setError(data.error || 'Failed to load friends');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriends();
  }, [childId]);

  const handleRemoveFriend = async (friendshipId: string) => {
    setDeletingId(friendshipId);
    try {
      const response = await fetch(`/api/parent/children/${childId}/friends?friendshipId=${friendshipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setFriends(friends.filter((f) => f.friendshipId !== friendshipId));
      } else {
        setError(data.error || 'Failed to remove friend');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Friend['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
            Pending your approval
          </span>
        );
      case 'pending_recipient':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
            Pending other parent
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-400">
            Friends
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
            Blocked
          </span>
        );
      default:
        return null;
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
          <h1 className="text-2xl font-bold text-white">{childName}&apos;s Friends</h1>
          <p className="text-gray-400">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
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

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-2">No friends yet</p>
          <p className="text-sm text-gray-500">
            When {childName} makes friends, they&apos;ll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend.friendshipId}
              className="bg-dark-800 rounded-xl border border-dark-700 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar avatarId={friend.avatarId} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium">{friend.displayName}</p>
                      {getStatusBadge(friend.status)}
                    </div>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {friend.conversationId && friend.status === 'approved' && (
                    <Link href={`/children/${childId}/conversations/${friend.conversationId}`} className="flex-1 sm:flex-initial">
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                        <MessageCircle size={16} className="mr-1" />
                        View Chat
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFriend(friend.friendshipId)}
                    isLoading={deletingId === friend.friendshipId}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
