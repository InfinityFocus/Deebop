'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageCircle,
  UserPlus,
  AlertCircle,
  ArrowRight,
  Bell,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared';
import { SubscriptionAlert } from '@/components/parent/SubscriptionAlert';
import { useAuthStore } from '@/stores/authStore';
import type { Child } from '@/types';

interface DashboardStats {
  childCount: number;
  pendingFriendRequests: number;
  pendingMessages: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'friend_request' | 'message' | 'child_created';
  childName: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, children, setChildren, setPendingCount } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Fetch children
        const childrenRes = await fetch('/api/parent/children');
        const childrenData = await childrenRes.json();

        if (childrenData.success) {
          setChildren(childrenData.data);
        }

        // Fetch pending approvals count
        const approvalsRes = await fetch('/api/parent/approvals');
        const approvalsData = await approvalsRes.json();

        if (approvalsData.success) {
          const pendingCount = approvalsData.data.friendRequests.length +
                              approvalsData.data.messages.length;
          setPendingCount(pendingCount);

          setStats({
            childCount: childrenData.data?.length || 0,
            pendingFriendRequests: approvalsData.data.friendRequests.length,
            pendingMessages: approvalsData.data.messages.length,
            recentActivity: approvalsData.data.recentActivity || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [setChildren, setPendingCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const totalPending = (stats?.pendingFriendRequests || 0) + (stats?.pendingMessages || 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
        </h1>
        <p className="text-gray-400">
          Here&apos;s what&apos;s happening with your children&apos;s accounts.
        </p>
      </div>

      {/* Subscription Alert */}
      <SubscriptionAlert className="mb-6" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Children"
          value={stats?.childCount || 0}
          href="/children"
          color="primary"
        />
        <StatCard
          icon={Bell}
          label="Pending Approvals"
          value={totalPending}
          href="/approvals"
          color={totalPending > 0 ? 'red' : 'gray'}
          highlight={totalPending > 0}
        />
        <StatCard
          icon={MessageCircle}
          label="Pending Messages"
          value={stats?.pendingMessages || 0}
          href="/approvals"
          color="cyan"
        />
      </div>

      {/* Invite Parents Card */}
      <InviteParentsCard />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pending Approvals */}
        {totalPending > 0 && (
          <div className="bg-dark-800 rounded-xl border border-red-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Needs Your Attention</h2>
                <p className="text-sm text-gray-400">
                  {totalPending} item{totalPending !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </div>
            <Link href="/approvals">
              <Button variant="outline" className="w-full">
                Review Approvals
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Add Child */}
        {(stats?.childCount || 0) === 0 ? (
          <div className="bg-dark-800 rounded-xl border border-primary-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                <UserPlus className="text-primary-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Get Started</h2>
                <p className="text-sm text-gray-400">
                  Create your first child account
                </p>
              </div>
            </div>
            <Link href="/children/new">
              <Button className="w-full">
                Add Child Account
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                <Users className="text-primary-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Your Children</h2>
                <p className="text-sm text-gray-400">
                  {stats?.childCount} account{stats?.childCount !== 1 ? 's' : ''} active
                </p>
              </div>
            </div>
            <Link href="/children">
              <Button variant="outline" className="w-full">
                Manage Children
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Children Quick View */}
      {children && children.length > 0 && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Children</h2>
            <Link href="/children/new" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              + Add Child
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.slice(0, 6).map((child) => (
              <ChildQuickCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
  color: 'primary' | 'red' | 'cyan' | 'gray';
  highlight?: boolean;
}) {
  const colors = {
    primary: 'bg-primary-500/10 text-primary-400',
    red: 'bg-red-500/10 text-red-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    gray: 'bg-dark-700 text-gray-400',
  };

  return (
    <Link href={href}>
      <div className={`bg-dark-800 rounded-xl border p-4 hover:border-dark-600 transition-colors ${
        highlight ? 'border-red-500/30' : 'border-dark-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ChildQuickCard({ child }: { child: Child }) {
  return (
    <Link href={`/children/${child.id}`}>
      <div className="bg-dark-700/50 rounded-lg p-4 hover:bg-dark-700 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
            {child.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{child.displayName}</p>
            <p className="text-sm text-gray-400">@{child.username}</p>
          </div>
          {child.messagingPaused && (
            <div className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
              Paused
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function InviteParentsCard() {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/parent/register`
    : '';

  const inviteMessage = `Join me on Deebop Chat - a safe messaging app for kids! Sign up here: ${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Deebop Chat',
          text: 'Join me on Deebop Chat - a safe messaging app for kids!',
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or share failed, show manual options
        if ((err as Error).name !== 'AbortError') {
          setShowShareOptions(true);
        }
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me on Deebop Chat');
    const body = encodeURIComponent(inviteMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(inviteMessage);
    window.open(`https://wa.me/?text=${text}`);
  };

  return (
    <div className="bg-gradient-to-r from-primary-500/10 to-cyan-500/10 rounded-xl border border-primary-500/20 p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Share2 className="text-primary-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Invite Other Parents</h2>
            <p className="text-sm text-gray-400">
              Know other parents whose kids would like to chat? Invite them to join!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="whitespace-nowrap flex-1 sm:flex-initial"
          >
            {copied ? (
              <>
                <Check size={16} className="mr-1 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                Copy Link
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleShare} className="flex-1 sm:flex-initial">
            <Share2 size={16} className="mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Share Options Modal/Dropdown */}
      {showShareOptions && (
        <div className="mt-4 pt-4 border-t border-dark-700">
          <p className="text-sm text-gray-400 mb-3">Share via:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={shareViaEmail}>
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={shareViaWhatsApp}>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareOptions(false)}
              className="text-gray-400"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
