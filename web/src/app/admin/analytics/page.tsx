'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Users,
  MousePointer,
  TrendingUp,
  Loader2,
  Globe,
  ArrowDown,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueSessions: number;
    avgScrollDepth: number;
  };
  ctaClicks: {
    explore: number;
    create_account: number;
    sign_in: number;
    create_event: number;
    build_creator_page: number;
    features: number;
  };
  scrollDepth: {
    reached25: number;
    reached50: number;
    reached75: number;
    reached100: number;
  };
  dailyViews: Array<{ date: string; views: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  conversionRate: number;
}

async function fetchAnalytics(days: number): Promise<AnalyticsData> {
  const res = await fetch(`/api/admin/analytics/homepage?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

const ctaLabels: Record<string, string> = {
  create_account: 'Create account',
  explore: 'Explore',
  features: 'Features',
  sign_in: 'Sign in',
  create_event: 'Create event',
  build_creator_page: 'Creator Page',
};

export default function HomepageAnalyticsPage() {
  const [days, setDays] = useState(7);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['homepage-analytics', days],
    queryFn: () => fetchAnalytics(days),
    refetchInterval: 60000, // Refresh every minute
  });

  const maxViews = data?.dailyViews.reduce((max, d) => Math.max(max, d.views), 0) || 1;

  // Sort CTAs by click count
  const sortedCtas = data
    ? Object.entries(data.ctaClicks)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => ({ name: key, clicks: value }))
    : [];

  const maxClicks = sortedCtas.length > 0 ? sortedCtas[0].clicks : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold">Homepage Analytics</h1>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition',
                days === d
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-red-400">Failed to load analytics. Are you logged in as admin?</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={Eye}
              label="Page Views"
              value={data.summary.totalViews}
              color="emerald"
            />
            <SummaryCard
              icon={Users}
              label="Unique Sessions"
              value={data.summary.uniqueSessions}
              color="cyan"
            />
            <SummaryCard
              icon={ArrowDown}
              label="Avg Scroll Depth"
              value={`${data.summary.avgScrollDepth}%`}
              color="yellow"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={`${data.conversionRate}%`}
              color="purple"
              subtitle="signups / views"
            />
          </div>

          {/* CTA Clicks & Scroll Funnel */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* CTA Clicks */}
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer size={18} className="text-emerald-400" />
                <h2 className="font-semibold text-white">CTA Clicks</h2>
              </div>
              <div className="space-y-3">
                {sortedCtas.map((cta) => (
                  <div key={cta.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{ctaLabels[cta.name] || cta.name}</span>
                      <span className="text-white font-medium">{cta.clicks}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(cta.clicks / maxClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {sortedCtas.length === 0 && (
                  <p className="text-gray-500 text-sm">No clicks recorded yet</p>
                )}
              </div>
            </div>

            {/* Scroll Funnel */}
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDown size={18} className="text-yellow-400" />
                <h2 className="font-semibold text-white">Scroll Funnel</h2>
              </div>
              <div className="space-y-4">
                {[
                  { depth: 25, reached: data.scrollDepth.reached25 },
                  { depth: 50, reached: data.scrollDepth.reached50 },
                  { depth: 75, reached: data.scrollDepth.reached75 },
                  { depth: 100, reached: data.scrollDepth.reached100 },
                ].map((item) => {
                  const percent = data.summary.uniqueSessions > 0
                    ? Math.round((item.reached / data.summary.uniqueSessions) * 100)
                    : 0;
                  return (
                    <div key={item.depth}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{item.depth}% scrolled</span>
                        <span className="text-white font-medium">{percent}% of visitors</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Views Chart */}
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-cyan-400" />
              <h2 className="font-semibold text-white">Daily Views</h2>
            </div>
            <div className="flex items-end gap-1 h-32">
              {data.dailyViews.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-cyan-500 rounded-t transition-all hover:bg-cyan-400"
                    style={{
                      height: `${(day.views / maxViews) * 100}%`,
                      minHeight: day.views > 0 ? '4px' : '0px',
                    }}
                    title={`${day.date}: ${day.views} views`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{data.dailyViews[0]?.date}</span>
              <span>{data.dailyViews[data.dailyViews.length - 1]?.date}</span>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-purple-400" />
              <h2 className="font-semibold text-white">Top Referrers</h2>
            </div>
            <div className="space-y-2">
              {data.topReferrers.length > 0 ? (
                data.topReferrers.map((ref, index) => (
                  <div
                    key={ref.referrer}
                    className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                      <span className="text-gray-300">{ref.referrer}</span>
                    </div>
                    <span className="text-white font-medium">{ref.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No referrer data yet</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  color: 'emerald' | 'cyan' | 'yellow' | 'purple';
  subtitle?: string;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx('p-1.5 rounded-lg', colorClasses[color])}>
          <Icon size={16} className={colorClasses[color].split(' ')[0]} />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
