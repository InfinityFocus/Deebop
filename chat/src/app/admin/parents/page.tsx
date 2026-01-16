'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

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
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Registered</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.parents.map((parent) => (
                <>
                  <tr
                    key={parent.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => setExpandedParent(expandedParent === parent.id ? null : parent.id)}
                  >
                    <td className="p-4 text-white">{parent.email}</td>
                    <td className="p-4 text-gray-300">{parent.display_name || '-'}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-gray-300">
                        <Users size={16} className="text-gray-500" />
                        {parent.childrenCount || 0}
                      </span>
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
                      {parent.childrenCount && parent.childrenCount > 0 ? (
                        expandedParent === parent.id ? (
                          <ChevronUp size={20} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-500" />
                        )
                      ) : null}
                    </td>
                  </tr>
                  {/* Expanded children row */}
                  {expandedParent === parent.id && parent.children && parent.children.length > 0 && (
                    <tr key={`${parent.id}-children`} className="bg-gray-800/30">
                      <td colSpan={6} className="p-4">
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
                  <td colSpan={6} className="p-8 text-center text-gray-500">
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
    </div>
  );
}
