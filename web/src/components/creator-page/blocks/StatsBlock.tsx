'use client';

import { clsx } from 'clsx';
import type { StatsBlockData } from '@/types/creator-page';

interface StatsBlockProps {
  data: StatsBlockData | Record<string, unknown>;
}

export function StatsBlock({ data }: StatsBlockProps) {
  const blockData = data as StatsBlockData;
  const items = blockData.items || [];
  const columns = blockData.columns || 3;

  if (items.length === 0) {
    return null;
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className="space-y-4">
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white text-center">
          {blockData.heading}
        </h3>
      )}

      <div
        className={clsx(
          'grid gap-4',
          gridCols[columns]
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center"
          >
            <div className="text-3xl font-bold text-white mb-1">
              {item.value}
            </div>
            <div className="text-sm text-gray-400">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
