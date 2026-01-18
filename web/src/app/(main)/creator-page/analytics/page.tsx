'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  MousePointer,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Lock,
  BarChart3,
  ExternalLink,
  Download,
  Mail,
} from 'lucide-react';
import type { CreatorPageAnalytics } from '@/types/creator-page';
import { getLimitsForTier } from '@/lib/creator-page-limits';

export default function CreatorPageAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CreatorPageAnalytics | null>(null);
  const [userTier, setUserTier] = useState<string>('creator');
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [emailCount, setEmailCount] = useState(0);

  const limits = getLimitsForTier(userTier);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/creator-page/analytics?range=${range}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          if (res.status === 403) {
            setError('Creator Page analytics requires Creator or Pro tier.');
            setLoading(false);
            return;
          }
          throw new Error('Failed to load analytics');
        }
        const data = await res.json();
        setAnalytics(data.analytics);
        setUserTier(data.tier || 'creator');
        setEmailCount(data.emailCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [router, range]);

  const handleExportEmails = async () => {
    try {
      const res = await fetch('/api/creator-page/email-signups/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-signups-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Lock size={48} className="text-gray-500 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Analytics Unavailable</h1>
        <p className="text-gray-400 text-center max-w-md mb-6">{error}</p>
        <Link
          href="/creator-page"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition"
        >
          Back to Builder
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/creator-page"
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-gray-500">Creator Page performance</p>
            </div>
          </div>

          {/* Range Selector */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setRange('7')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                range === '7' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setRange('30')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                range === '30' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              30 days
            </button>
            {limits?.analyticsRangeDays === 90 && (
              <button
                onClick={() => setRange('90')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  range === '90' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                90 days
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye size={20} className="text-blue-400" />
              </div>
              <span className="text-gray-400">Page Views</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {range === '7' ? analytics?.views.last7Days : range === '30' ? analytics?.views.last30Days : analytics?.views.total}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics?.views.total.toLocaleString()} total
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <MousePointer size={20} className="text-emerald-400" />
              </div>
              <span className="text-gray-400">Link Clicks</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {range === '7' ? analytics?.clicks.last7Days : range === '30' ? analytics?.clicks.last30Days : analytics?.clicks.total}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics?.clicks.total.toLocaleString()} total
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <span className="text-gray-400">Click Rate</span>
            </div>
            {limits?.canViewCtr ? (
              <>
                <p className="text-3xl font-bold text-white">
                  {analytics?.views.last30Days && analytics?.clicks.last30Days
                    ? ((analytics.clicks.last30Days / analytics.views.last30Days) * 100).toFixed(1)
                    : '0'}
                  %
                </p>
                <p className="text-sm text-gray-500 mt-1">Clicks / Views</p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Lock size={16} />
                <span className="text-sm">Pro only</span>
              </div>
            )}
          </div>
        </div>

        {/* Email Signups Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Mail size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Email Signups</h2>
                <p className="text-sm text-gray-500">{emailCount} subscribers</p>
              </div>
            </div>
            {emailCount > 0 && (
              <button
                onClick={handleExportEmails}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Top Links */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <BarChart3 size={20} className="text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Top Clicked Links</h2>
          </div>

          {analytics?.topLinks && analytics.topLinks.length > 0 ? (
            <div className="space-y-3">
              {analytics.topLinks.slice(0, 10).map((link, i) => (
                <div
                  key={`${link.blockId}-${link.linkIndex}`}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6">#{i + 1}</span>
                    <span className="text-white">{link.label || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-medium">
                      {link.clicks} click{link.clicks !== 1 ? 's' : ''}
                    </span>
                    {limits?.canViewCtr && link.ctr !== undefined && (
                      <span className="text-gray-500 text-sm">
                        {link.ctr.toFixed(1)}% CTR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No clicks recorded yet</p>
          )}
        </div>

        {/* Top Referrers (Pro only) */}
        {limits?.canViewReferrers ? (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <ExternalLink size={20} className="text-pink-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Top Referrers</h2>
            </div>

            {analytics?.topReferrers && analytics.topReferrers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topReferrers.map((ref, i) => (
                  <div
                    key={ref.referrer}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-6">#{i + 1}</span>
                      <span className="text-white truncate max-w-xs">
                        {ref.referrer || 'Direct'}
                      </span>
                    </div>
                    <span className="text-pink-400 font-medium">
                      {ref.count} visit{ref.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No referrer data yet</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <ExternalLink size={20} className="text-pink-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Top Referrers</h2>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Lock size={16} />
                <span className="text-sm">Pro feature</span>
              </div>
            </div>
            <p className="text-gray-500 mt-4">
              Upgrade to Pro to see where your visitors are coming from.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
