'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, Mic, MicOff, Pause, Play } from 'lucide-react';
import { Avatar } from '@/components/child/AvatarSelector';

interface Child {
  id: string;
  username: string;
  display_name: string;
  avatar_id: string;
  age_band: string;
  oversight_mode: string;
  messaging_paused: boolean;
  voice_messaging_enabled: boolean;
  created_at: string;
  parent?: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

interface PaginatedResponse {
  children: Child[];
  total: number;
  page: number;
  totalPages: number;
}

const AGE_BANDS = [
  { value: '', label: 'All Ages' },
  { value: '6-8', label: '6-8 years' },
  { value: '9-10', label: '9-10 years' },
  { value: '11-12', label: '11-12 years' },
];

const OVERSIGHT_MODES = [
  { value: '', label: 'All Modes' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'approve_first', label: 'Approve First' },
  { value: 'approve_all', label: 'Approve All' },
];

export default function AdminChildren() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ageBand, setAgeBand] = useState('');
  const [oversightMode, setOversightMode] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchChildren() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        if (search) params.set('search', search);
        if (ageBand) params.set('ageBand', ageBand);
        if (oversightMode) params.set('oversightMode', oversightMode);

        const response = await fetch(`/api/admin/children?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load children');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchChildren, 300);
    return () => clearTimeout(debounce);
  }, [search, ageBand, oversightMode, page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getOversightLabel = (mode: string) => {
    switch (mode) {
      case 'monitor':
        return 'Monitor';
      case 'approve_first':
        return 'Approve First';
      case 'approve_all':
        return 'Approve All';
      default:
        return mode;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Children</h1>
        <div className="text-sm text-gray-400">
          {data?.total || 0} total
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={ageBand}
          onChange={(e) => {
            setAgeBand(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {AGE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </select>
        <select
          value={oversightMode}
          onChange={(e) => {
            setOversightMode(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {OVERSIGHT_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
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

      {/* Grid */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.children.map((child) => (
            <div
              key={child.id}
              className="bg-gray-900 rounded-xl border border-gray-800 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar avatarId={child.avatar_id} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{child.display_name}</h3>
                  <p className="text-gray-500 text-sm">@{child.username}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Age Band</span>
                  <span className="text-gray-300">{child.age_band}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Oversight</span>
                  <span className="text-gray-300">{getOversightLabel(child.oversight_mode)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`flex items-center gap-1 ${child.messaging_paused ? 'text-yellow-400' : 'text-green-400'}`}>
                    {child.messaging_paused ? <Pause size={12} /> : <Play size={12} />}
                    {child.messaging_paused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Voice</span>
                  <span className={`flex items-center gap-1 ${child.voice_messaging_enabled ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {child.voice_messaging_enabled ? <Mic size={12} /> : <MicOff size={12} />}
                    {child.voice_messaging_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {child.parent && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500">Parent</p>
                  <p className="text-sm text-gray-300 truncate">{child.parent.email}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created {formatDate(child.created_at)}
                </span>
                <Link
                  href={`/admin/conversations?child=${child.username}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  View Chats
                </Link>
              </div>
            </div>
          ))}
          {data.children.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No children found
            </div>
          )}
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
