'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, Users, CheckCircle, XCircle, Gift, MoreHorizontal, X } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';
import type { SubscriptionStatus } from '@/types';

interface ParentSubscription {
  id: string;
  status: SubscriptionStatus;
  isFreeAccount: boolean;
  freeAccountReason: string | null;
}

interface Parent {
  id: string;
  email: string;
  display_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
  childrenCount?: number;
  children?: {
    id: string;
    username: string;
    displayName: string;
    avatarId: string;
    ageBand: string;
  }[];
  subscription?: ParentSubscription | null;
}

interface PaginatedResponse {
  parents: Parent[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminParents() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [grantFreeModal, setGrantFreeModal] = useState<{ parentId: string; email: string } | null>(null);
  const [freeReason, setFreeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Record<string, ParentSubscription | null>>({});

  useEffect(() => {
    async function fetchParents() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          includeChildren: 'true',
        });
        if (search) params.set('search', search);

        const response = await fetch(`/api/admin/parents?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load parents');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchParents, 300);
    return () => clearTimeout(debounce);
  }, [search, page]);

  // Fetch subscriptions for visible parents
  useEffect(() => {
    if (!data?.parents) return;

    async function fetchSubscriptions() {
      const newSubscriptions: Record<string, ParentSubscription | null> = {};

      await Promise.all(
        data!.parents.map(async (parent) => {
          try {
            const response = await fetch(`/api/admin/parents/${parent.id}/subscription`);
            const result = await response.json();
            if (result.success) {
              newSubscriptions[parent.id] = result.data;
            }
          } catch {
            newSubscriptions[parent.id] = null;
          }
        })
      );

      setSubscriptions(newSubscriptions);
    }

    fetchSubscriptions();
  }, [data]);

  const handleGrantFree = async () => {
    if (!grantFreeModal || !freeReason.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/parents/${grantFreeModal.parentId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: freeReason.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setSubscriptions((prev) => ({
          ...prev,
          [grantFreeModal.parentId]: result.data,
        }));
        setGrantFreeModal(null);
        setFreeReason('');
      } else {
        alert(result.error || 'Failed to grant free account');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeFree = async (parentId: string) => {
    if (!confirm('Are you sure you want to revoke free access? The account will become inactive.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/parents/${parentId}/subscription`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSubscriptions((prev) => ({
          ...prev,
          [parentId]: result.data,
        }));
      } else {
        alert(result.error || 'Failed to revoke free account');
      }
    } catch {
      alert('Something went wrong');
    }
    setActionMenuId(null);
  };

  const getSubscriptionBadge = (sub: ParentSubscription | null) => {
    if (!sub) {
      return <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">No subscription</span>;
    }

    if (sub.isFreeAccount) {
      return (
        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded flex items-center gap-1">
          <Gift size={12} />
          Free
        </span>
      );
    }

    const statusStyles: Record<SubscriptionStatus, string> = {
      inactive: 'bg-gray-700 text-gray-400',
      trial: 'bg-cyan-500/20 text-cyan-400',
      active: 'bg-green-500/20 text-green-400',
      past_due: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-yellow-500/20 text-yellow-400',
      free: 'bg-emerald-500/20 text-emerald-400',
    };

    const statusLabels: Record<SubscriptionStatus, string> = {
      inactive: 'Inactive',
      trial: 'Trial',
      active: 'Active',
      past_due: 'Past Due',
      cancelled: 'Cancelled',
      free: 'Free',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${statusStyles[sub.status]}`}>
        {statusLabels[sub.status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Parents</h1>
        <div className="text-sm text-gray-400">
          {data?.total || 0} total
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-cyan-500" size={32} />
        </div>
      )}

      {/* Table */}
      {!isLoading && data && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                <th className="text-left p-4 text-gray-400 font-medium">Children</th>
                <th className="text-left p-4 text-gray-400 font-medium">Subscription</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Registered</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {data.parents.map((parent) => (
                <>
                  <tr
                    key={parent.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    <td
                      className="p-4 text-white cursor-pointer"
                      onClick={() => setExpandedParent(expandedParent === parent.id ? null : parent.id)}
                    >
                      {parent.email}
                    </td>
                    <td className="p-4 text-gray-300">{parent.display_name || '-'}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-gray-300">
                        <Users size={16} className="text-gray-500" />
                        {parent.childrenCount || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      {getSubscriptionBadge(subscriptions[parent.id])}
                    </td>
                    <td className="p-4">
                      {parent.onboarding_completed ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={14} />
                          <span className="text-sm">Complete</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <XCircle size={14} />
                          <span className="text-sm">Onboarding</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{formatDate(parent.created_at)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {parent.childrenCount && parent.childrenCount > 0 ? (
                          <button
                            onClick={() => setExpandedParent(expandedParent === parent.id ? null : parent.id)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            {expandedParent === parent.id ? (
                              <ChevronUp size={18} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-500" />
                            )}
                          </button>
                        ) : null}
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === parent.id ? null : parent.id)}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <MoreHorizontal size={18} className="text-gray-500" />
                          </button>
                          {actionMenuId === parent.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1">
                              {!subscriptions[parent.id]?.isFreeAccount ? (
                                <button
                                  onClick={() => {
                                    setGrantFreeModal({ parentId: parent.id, email: parent.email });
                                    setActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-gray-700"
                                >
                                  <Gift size={16} />
                                  Grant Free Access
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRevokeFree(parent.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                                >
                                  <X size={16} />
                                  Revoke Free Access
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded children row */}
                  {expandedParent === parent.id && parent.children && parent.children.length > 0 && (
                    <tr key={`${parent.id}-children`} className="bg-gray-800/30">
                      <td colSpan={7} className="p-4">
                        <div className="pl-4 space-y-2">
                          <h4 className="text-sm text-gray-400 mb-3">Children:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {parent.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg"
                              >
                                <Avatar avatarId={child.avatarId} size="sm" />
                                <div>
                                  <p className="text-white text-sm">{child.displayName}</p>
                                  <p className="text-gray-500 text-xs">
                                    @{child.username} · {child.ageBand}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {data.parents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No parents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-900 text-gray-300 rounded-lg border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 bg-gray-900 text-gray-300 rounded-lg border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}

      {/* Grant Free Access Modal */}
      {grantFreeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Grant Free Access</h2>
              <p className="text-sm text-gray-400 mt-1">
                Granting free access to {grantFreeModal.email}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for free access
              </label>
              <textarea
                value={freeReason}
                onChange={(e) => setFreeReason(e.target.value)}
                placeholder="e.g., Beta tester, Staff account, Special arrangement..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={3}
              />
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setGrantFreeModal(null);
                  setFreeReason('');
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantFree}
                disabled={!freeReason.trim() || isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Gift size={16} />
                    Grant Free Access
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
