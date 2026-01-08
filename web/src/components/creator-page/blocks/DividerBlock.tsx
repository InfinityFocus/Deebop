'use client';

import type { DividerBlockData } from '@/types/creator-page';

interface DividerBlockProps {
  data: DividerBlockData | Record<string, unknown>;
}

export function DividerBlock({ data }: DividerBlockProps) {
  const dividerData = data as DividerBlockData;
  const style = dividerData.style || 'space';
  const height = dividerData.height || 'medium';

  const heightClasses = {
    small: 'h-4',
    medium: 'h-8',
    large: 'h-12',
  };

  if (style === 'line') {
    return (
      <div className={`${heightClasses[height]} flex items-center`}>
        <div className="w-full border-t border-gray-700" />
      </div>
    );
  }

  if (style === 'dots') {
    return (
      <div className={`${heightClasses[height]} flex items-center justify-center gap-2`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
      </div>
    );
  }

  // Default: space
  return <div className={heightClasses[height]} />;
}
