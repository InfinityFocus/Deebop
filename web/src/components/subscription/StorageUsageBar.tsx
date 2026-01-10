'use client';

import { clsx } from 'clsx';
import { HardDrive } from 'lucide-react';
import Link from 'next/link';

interface StorageUsageBarProps {
  used: number;
  max: number;
  percentage: number;
  showUpgradeLink?: boolean;
  compact?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

export function StorageUsageBar({
  used,
  max,
  percentage,
  showUpgradeLink = true,
  compact = false,
}: StorageUsageBarProps) {
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <HardDrive size={18} className="text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-300">Album Storage</span>
            <span className={clsx(
              'font-medium',
              isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-300'
            )}>
              {formatBytes(used)} / {formatBytes(max)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                isAtLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive size={20} className="text-gray-400" />
          <span className="text-white font-medium">Album Storage</span>
        </div>
        <span className={clsx(
          'text-sm font-medium',
          isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-400'
        )}>
          {percentage}% used
        </span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={clsx(
            'h-full rounded-full transition-all',
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {formatBytes(used)} of {formatBytes(max)} used
        </span>
        {showUpgradeLink && isNearLimit && (
          <Link
            href="/settings/subscription"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            Upgrade for more
          </Link>
        )}
      </div>
    </div>
  );
}
