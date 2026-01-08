'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  Users,
  Crown,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'standard' | 'pro';
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  reports_count: number;
  created_at: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchUsers(params: {
  search: string;
  tier: string;
  status: string;
  page: number;
}): Promise<UsersResponse> {
  const searchParams = new URLSearchParams({
    search: params.search,
    tier: params.tier,
    status: params.status,
    page: params.page.toString(),
    limit: '20',
  });
  const res = await fetch(`/api/admin/users?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModal, setActionModal] = useState<'suspend' | 'tier' | 'delete' | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [newTier, setNewTier] = useState<'free' | 'standard' | 'pro'>('free');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', search, tierFilter, statusFilter, page],
    queryFn: () => fetchUsers({ search, tier: tierFilter, status: statusFilter, page }),
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, action, tier, reason }: {
      userId: string;
      action: string;
      tier?: string;
      reason?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tier, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      closeModal();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      closeModal();
    },
  });

  const closeModal = () => {
    setSelectedUser(null);
    setActionModal(null);
    setSuspendReason('');
    setNewTier('free');
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white';
      case 'standard':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        Failed to load users. Make sure you are an admin.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-emerald-400" aria-hidden="true" />
          User Management
        </h1>
        <p className="text-sm text-gray-400">
          {data?.pagination.total.toLocaleString()} total users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username, email, or name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Search users"
          />
        </div>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Filter by tier"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="standard">Standard</option>
          <option value="pro">Pro</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users List */}
      {data?.users.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <Users size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.users.map((user) => (
            <div
              key={user.id}
              className={clsx(
                'bg-gray-800 rounded-xl border p-4',
                user.is_suspended ? 'border-red-500/30' : 'border-gray-700'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.display_name?.[0]?.toUpperCase() ||
                    user.username[0].toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">
                      {user.display_name || user.username}
                    </span>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs capitalize', getTierBadge(user.tier))}>
                      {user.tier}
                    </span>
                    {user.is_suspended && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                        <Ban size={10} aria-hidden="true" />
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    @{user.username} · {user.email}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{user.posts_count} posts</span>
                    <span>{user.followers_count} followers</span>
                    {user.reports_count > 0 && (
                      <span className="text-red-400">{user.reports_count} reports</span>
                    )}
                    <span>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View Posts */}
                  <Link
                    href={`/admin/users/${user.id}/posts`}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="View user posts"
                    title="View posts"
                  >
                    <FileText size={18} />
                  </Link>

                  {/* Suspend/Unsuspend */}
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      if (user.is_suspended) {
                        updateUser.mutate({ userId: user.id, action: 'unsuspend' });
                      } else {
                        setActionModal('suspend');
                      }
                    }}
                    disabled={updateUser.isPending}
                    className={clsx(
                      'p-2 rounded-lg transition min-w-[40px] min-h-[40px] flex items-center justify-center',
                      user.is_suspended
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-orange-400 hover:bg-orange-500/20'
                    )}
                    aria-label={user.is_suspended ? 'Unsuspend user' : 'Suspend user'}
                    title={user.is_suspended ? 'Unsuspend' : 'Suspend'}
                  >
                    {user.is_suspended ? <CheckCircle size={18} /> : <Ban size={18} />}
                  </button>

                  {/* Change Tier */}
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setNewTier(user.tier);
                      setActionModal('tier');
                    }}
                    className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Change user tier"
                    title="Change tier"
                  >
                    <Crown size={18} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setActionModal('delete');
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Delete user"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {actionModal === 'suspend' && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-modal-title"
        >
          <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 id="suspend-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                <Ban size={24} className="text-orange-400" aria-hidden="true" />
                Suspend User
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-300">
                Suspend <span className="font-semibold text-white">@{selectedUser.username}</span>?
                They will not be able to log in or access their account.
              </p>
              <div>
                <label htmlFor="suspend-reason" className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Why is this user being suspended?"
                  className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateUser.mutate({
                    userId: selectedUser.id,
                    action: 'suspend',
                    reason: suspendReason,
                  })}
                  disabled={updateUser.isPending}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateUser.isPending ? <Loader2 size={20} className="animate-spin" /> : <Ban size={20} />}
                  Suspend
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Tier Modal */}
      {actionModal === 'tier' && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tier-modal-title"
        >
          <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 id="tier-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                <Crown size={24} className="text-emerald-400" aria-hidden="true" />
                Change Tier
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-300">
                Change tier for <span className="font-semibold text-white">@{selectedUser.username}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'standard', 'pro'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setNewTier(tier)}
                    className={clsx(
                      'py-3 rounded-lg text-center capitalize transition',
                      newTier === tier
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateUser.mutate({
                    userId: selectedUser.id,
                    action: 'change_tier',
                    tier: newTier,
                  })}
                  disabled={updateUser.isPending || newTier === selectedUser.tier}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateUser.isPending ? <Loader2 size={20} className="animate-spin" /> : <Crown size={20} />}
                  Update Tier
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {actionModal === 'delete' && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 id="delete-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} className="text-red-400" aria-hidden="true" />
                Delete User
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-medium mb-2">This action cannot be undone!</p>
                <p className="text-gray-300 text-sm">
                  Deleting <span className="font-semibold text-white">@{selectedUser.username}</span> will
                  permanently remove their account and all associated content including posts, likes, and comments.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteUser.mutate(selectedUser.id)}
                  disabled={deleteUser.isPending}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteUser.isPending ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  Delete User
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
