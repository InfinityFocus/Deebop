'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  LayoutDashboard,
  Flag,
  Megaphone,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Ban,
  BarChart3,
  Inbox,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardStats {
  pendingReports: number;
  totalReports: number;
  activeAds: number;
  totalAds: number;
  totalUsers: number;
  suspendedUsers: number;
  totalPosts: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/admin/dashboard');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

const adminSections = [
  {
    href: '/admin/inbox',
    icon: Inbox,
    label: 'Inbox',
    description: 'Contact form messages from users',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'User Management',
    description: 'View, suspend, or modify user accounts',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    href: '/admin/moderation',
    icon: Flag,
    label: 'Moderation Queue',
    description: 'Review reported content and take action',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  {
    href: '/admin/ads',
    icon: Megaphone,
    label: 'Ad Management',
    description: 'Create and manage platform advertisements',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    href: '/admin/analytics',
    icon: BarChart3,
    label: 'Homepage Analytics',
    description: 'Track homepage views, clicks, and conversions',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
];

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-emerald-400" aria-hidden="true" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage your platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={AlertTriangle}
            label="Pending Reports"
            value={stats?.pendingReports}
            isLoading={isLoading}
            highlight={stats?.pendingReports ? stats.pendingReports > 0 : false}
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.totalUsers}
            isLoading={isLoading}
          />
          <StatCard
            icon={Ban}
            label="Suspended"
            value={stats?.suspendedUsers}
            isLoading={isLoading}
            highlight={stats?.suspendedUsers ? stats.suspendedUsers > 0 : false}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Posts"
            value={stats?.totalPosts}
            isLoading={isLoading}
          />
          <StatCard
            icon={Megaphone}
            label="Active Ads"
            value={stats?.activeAds}
            isLoading={isLoading}
          />
        </div>

        {/* Quick Access Sections */}
        <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={clsx(
                  'group p-6 rounded-xl border transition-all',
                  'bg-gray-900 hover:bg-gray-800',
                  section.borderColor
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={clsx('p-3 rounded-lg', section.bgColor)}>
                    <Icon size={24} className={section.color} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {section.label}
                      <ExternalLink
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      />
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{section.description}</p>
                  </div>
                </div>

                {/* Show user counts */}
                {section.href === '/admin/users' && stats?.totalUsers !== undefined && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                      {stats.totalUsers} users
                    </span>
                    {stats.suspendedUsers > 0 && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
                        <Ban size={12} aria-hidden="true" />
                        {stats.suspendedUsers} suspended
                      </span>
                    )}
                  </div>
                )}

                {/* Show pending count for moderation */}
                {section.href === '/admin/moderation' && stats?.pendingReports !== undefined && stats.pendingReports > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                      {stats.pendingReports} pending
                    </span>
                  </div>
                )}

                {/* Show active count for ads */}
                {section.href === '/admin/ads' && stats?.activeAds !== undefined && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} aria-hidden="true" />
                      {stats.activeAds} active
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            Failed to load dashboard stats. Make sure you are an admin.
          </div>
        )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  highlight = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: number;
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'p-4 rounded-xl border bg-gray-900',
        highlight ? 'border-red-500/50' : 'border-gray-800'
      )}
    >
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon size={16} aria-hidden="true" />
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      {isLoading ? (
        <Loader2 size={20} className="animate-spin text-gray-500" />
      ) : (
        <p className={clsx(
          'text-2xl font-bold',
          highlight ? 'text-red-400' : 'text-white'
        )}>
          {value?.toLocaleString() ?? '-'}
        </p>
      )}
    </div>
  );
}
