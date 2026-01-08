'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Rocket, TrendingUp, MousePointer, Pause, Play, XCircle, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface Boost {
  id: string;
  post_id: string;
  budget_cents: number;
  spent_cents: number;
  impressions: number;
  clicks: number;
  status: string;
  target_countries: string[];
  start_date: string;
  end_date: string | null;
  created_at: string;
  post: {
    id: string;
    content_type: string;
    text_content: string | null;
    media_url: string | null;
    media_thumbnail_url: string | null;
  };
}

async function fetchBoosts(): Promise<{ boosts: Boost[] }> {
  const res = await fetch('/api/boosts');
  if (!res.ok) throw new Error('Failed to fetch boosts');
  return res.json();
}

export default function BoostsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boosts'],
    queryFn: fetchBoosts,
  });

  const updateBoost = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch(`/api/boosts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to update boost');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boosts'] });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      case 'pending_payment':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
          Boost activated! Your post is now being promoted.
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400">
          Boost payment was canceled.
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rocket className="text-purple-400" />
            Your Boosts
          </h1>
          <p className="text-gray-400 mt-1">Manage your promoted posts</p>
        </div>
      </div>

      {isError ? (
        <div className="text-center py-8 text-red-400">
          Failed to load boosts. Please try again.
        </div>
      ) : data?.boosts.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <Rocket size={48} className="mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No boosts yet</h2>
          <p className="text-gray-400 mb-4">
            Boost a post to reach more people and grow your audience
          </p>
          <p className="text-sm text-gray-500">
            Click the Boost button on any of your posts to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.boosts.map((boost) => {
            const ctr = boost.impressions > 0
              ? ((boost.clicks / boost.impressions) * 100).toFixed(2)
              : '0.00';
            const budgetUsed = (boost.spent_cents / boost.budget_cents) * 100;

            return (
              <div
                key={boost.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Post preview */}
                      {boost.post.media_url ? (
                        <img
                          src={boost.post.media_thumbnail_url || boost.post.media_url}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Rocket size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium line-clamp-1">
                          {boost.post.text_content || 'Media post'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Started {formatDistanceToNow(new Date(boost.start_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className={clsx('px-3 py-1 rounded-full text-sm capitalize', getStatusColor(boost.status))}>
                      {boost.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-1">
                        <Eye size={14} />
                        Impressions
                      </div>
                      <p className="text-xl font-bold text-white">
                        {boost.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-1">
                        <MousePointer size={14} />
                        Clicks
                      </div>
                      <p className="text-xl font-bold text-white">
                        {boost.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-1">
                        <TrendingUp size={14} />
                        CTR
                      </div>
                      <p className="text-xl font-bold text-white">{ctr}%</p>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-sm mb-1">Spent</div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(boost.spent_cents)}
                      </p>
                    </div>
                  </div>

                  {/* Budget progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Budget used</span>
                      <span className="text-white">
                        {formatCurrency(boost.spent_cents)} / {formatCurrency(boost.budget_cents)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  {['active', 'paused'].includes(boost.status) && (
                    <div className="flex gap-2">
                      {boost.status === 'active' ? (
                        <button
                          onClick={() => updateBoost.mutate({ id: boost.id, action: 'pause' })}
                          disabled={updateBoost.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition"
                        >
                          <Pause size={16} />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => updateBoost.mutate({ id: boost.id, action: 'resume' })}
                          disabled={updateBoost.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition"
                        >
                          <Play size={16} />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => updateBoost.mutate({ id: boost.id, action: 'cancel' })}
                        disabled={updateBoost.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
