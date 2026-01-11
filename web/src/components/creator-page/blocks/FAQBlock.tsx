'use client';

import { ChevronDown } from 'lucide-react';
import type { FAQBlockData } from '@/types/creator-page';

interface FAQBlockProps {
  data: FAQBlockData | Record<string, unknown>;
}

export function FAQBlock({ data }: FAQBlockProps) {
  const blockData = data as FAQBlockData;
  const items = blockData.items || [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white mb-4">
          {blockData.heading}
        </h3>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.id}
            className="group bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-gray-800/80 transition">
              <span className="text-white font-medium pr-4">{item.question}</span>
              <ChevronDown
                size={20}
                className="text-gray-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="px-4 pb-4 pt-0">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
