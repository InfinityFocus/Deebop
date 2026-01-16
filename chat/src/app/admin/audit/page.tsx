'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  FileText,
  UserPlus,
  UserCog,
  UserMinus,
  CheckCircle,
  XCircle,
  LogIn,
  Shield,
  Filter,
} from 'lucide-react';

interface AuditLog {
  id: string;
  parent_id: string;
  parent_email: string;
  action: string;
  child_id: string | null;
  child_username: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface PaginatedResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'child_login', label: 'Child Login' },
  { value: 'child_created', label: 'Child Created' },
  { value: 'child_updated', label: 'Child Updated' },
  { value: 'child_deleted', label: 'Child Deleted' },
  { value: 'message_approved', label: 'Message Approved' },
  { value: 'message_denied', label: 'Message Denied' },
  { value: 'friendship_approved', label: 'Friendship Approved' },
  { value: 'friendship_blocked', label: 'Friendship Blocked' },
];

export default function AdminAudit() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
        });
        if (action) params.set('action', action);
        if (parentEmail) params.set('parentEmail', parentEmail);

        const response = await fetch(`/api/admin/audit?${params}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load audit logs');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchLogs, 300);
    return () => clearTimeout(debounce);
  }, [action, parentEmail, page]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'child_login':
        return <LogIn size={16} className="text-cyan-400" />;
      case 'child_created':
        return <UserPlus size={16} className="text-green-400" />;
      case 'child_updated':
        return <UserCog size={16} className="text-yellow-400" />;
      case 'child_deleted':
        return <UserMinus size={16} className="text-red-400" />;
      case 'message_approved':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'message_denied':
        return <XCircle size={16} className="text-red-400" />;
      case 'friendship_approved':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'friendship_blocked':
        return <Shield size={16} className="text-red-400" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      child_login: 'Child Login',
      child_created: 'Child Created',
      child_updated: 'Child Updated',
      child_deleted: 'Child Deleted',
      message_approved: 'Message Approved',
      message_denied: 'Message Denied',
      friendship_approved: 'Friendship Approved',
      friendship_blocked: 'Friendship Blocked',
    };
    return labels[actionType] || actionType;
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      child_login: 'bg-cyan-500/20 text-cyan-400',
      child_created: 'bg-green-500/20 text-green-400',
      child_updated: 'bg-yellow-500/20 text-yellow-400',
      child_deleted: 'bg-red-500/20 text-red-400',
      message_approved: 'bg-green-500/20 text-green-400',
      message_denied: 'bg-red-500/20 text-red-400',
      friendship_approved: 'bg-green-500/20 text-green-400',
      friendship_blocked: 'bg-red-500/20 text-red-400',
    };
    return colors[actionType] || 'bg-gray-500/20 text-gray-400';
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    const entries = Object.entries(details);
    if (entries.length === 0) return null;
    return entries.map(([key, value]) => (
      <span key={key} className="inline-block mr-2">
        <span className="text-gray-600">{key}:</span>{' '}
        <span className="text-gray-400">{String(value)}</span>
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <div className="text-sm text-gray-400">{data?.total || 0} entries</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Filter by parent email..."
            value={parentEmail}
            onChange={(e) => {
              setParentEmail(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
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
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Timestamp
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Parent
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Action
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Child
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/50">
                  <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </td>
                  <td className="p-4 text-sm text-gray-300">{log.parent_email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionIcon(log.action)}
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {log.child_username ? `@${log.child_username}` : '—'}
                  </td>
                  <td className="p-4 text-xs">{formatDetails(log.details)}</td>
                </tr>
              ))}
              {data.logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No audit logs found
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
