'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { Avatar } from '@/components/child/AvatarSelector';

interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarId: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
}

export default function AddFriendPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSearchResult(null);

    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/child/friends/search?username=${encodeURIComponent(searchQuery.toLowerCase())}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.data) {
          setSearchResult(data.data);
        } else {
          setError('No user found with that username');
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/child/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendChildId: searchResult.id }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Friend request sent! Your parent needs to approve it.');
        setSearchResult(null);
        setSearchQuery('');

        // Redirect after short delay
        setTimeout(() => router.push('/friends'), 2000);
      } else {
        setError(data.error || 'Failed to send request');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/friends" className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white">Add Friend</h1>
      </div>

      {/* Info */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
        <p className="text-cyan-400 text-sm">
          Search for your friend&apos;s username to send them a friend request.
          Your parent will need to approve the request.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <CheckCircle className="text-primary-400 flex-shrink-0" size={20} />
          <p className="text-primary-400 text-sm">{success}</p>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            leftIcon={<span className="text-gray-500">@</span>}
          />
        </div>
        <Button type="submit" isLoading={isSearching}>
          <Search size={18} />
        </Button>
      </form>

      {/* Search Result */}
      {searchResult && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
          <div className="flex items-center gap-4">
            <Avatar avatarId={searchResult.avatarId} size="lg" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-white">
                {searchResult.displayName}
              </p>
              <p className="text-gray-400">@{searchResult.username}</p>
            </div>
          </div>

          <div className="mt-4">
            {searchResult.isAlreadyFriend ? (
              <Button variant="outline" className="w-full" disabled>
                <CheckCircle size={18} className="mr-2" />
                Already Friends!
              </Button>
            ) : searchResult.hasPendingRequest ? (
              <Button variant="outline" className="w-full" disabled>
                <AlertCircle size={18} className="mr-2" />
                Request Already Sent
              </Button>
            ) : (
              <Button
                className="w-full bg-cyan-500 hover:bg-cyan-600"
                onClick={handleSendRequest}
                isLoading={isSending}
              >
                <UserPlus size={18} className="mr-2" />
                Send Friend Request
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
