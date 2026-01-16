'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Baby,
  MessageSquare,
  Clock,
  Send,
  XCircle,
  TrendingUp,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalParents: number;
  totalChildren: number;
  totalConversations: number;
  pendingApprovals: number;
  pendingMessages: number;
  pendingFriendships: number;
  messagesToday: number;
  denialRate: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Parents"
          value={stats?.totalParents || 0}
          color="cyan"
        />
        <StatCard
          icon={Baby}
          label="Children"
          value={stats?.totalChildren || 0}
          color="cyan"
        />
        <StatCard
          icon={MessageSquare}
          label="Conversations"
          value={stats?.totalConversations || 0}
          color="cyan"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats?.pendingApprovals || 0}
          color={stats?.pendingApprovals ? 'yellow' : 'cyan'}
        />
        <StatCard
          icon={Send}
          label="Messages Today"
          value={stats?.messagesToday || 0}
          color="cyan"
        />
        <StatCard
          icon={XCircle}
          label="Denial Rate"
          value={`${stats?.denialRate || 0}%`}
          color={stats?.denialRate && stats.denialRate > 10 ? 'red' : 'cyan'}
        />
      </div>

      {/* Pending Breakdown */}
      {stats && stats.pendingApprovals > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <h3 className="text-yellow-400 font-medium mb-2">Pending Approvals Breakdown</h3>
          <div className="flex gap-6 text-sm">
            <span className="text-gray-300">
              <span className="text-yellow-400 font-medium">{stats.pendingMessages}</span> messages
            </span>
            <span className="text-gray-300">
              <span className="text-yellow-400 font-medium">{stats.pendingFriendships}</span> friend requests
            </span>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink
          href="/admin/parents"
          icon={Users}
          title="Manage Parents"
          description="View and search parent accounts"
        />
        <QuickLink
          href="/admin/children"
          icon={Baby}
          title="Manage Children"
          description="View children with filters"
        />
        <QuickLink
          href="/admin/conversations"
          icon={MessageSquare}
          title="Browse Conversations"
          description="Monitor all conversations"
        />
        <QuickLink
          href="/admin/messages"
          icon={TrendingUp}
          title="Search Messages"
          description="Find specific messages"
        />
        <QuickLink
          href="/admin/audit"
          icon={Clock}
          title="Audit Log"
          description="View all parent actions"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: 'cyan' | 'yellow' | 'red';
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <Icon size={20} className="mb-2" />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group"
    >
      <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ChevronRight
        size={20}
        className="text-gray-600 group-hover:text-gray-400 transition-colors"
      />
    </Link>
  );
}
