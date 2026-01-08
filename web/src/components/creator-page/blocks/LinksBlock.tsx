'use client';

import { ExternalLink } from 'lucide-react';
import type { LinksBlockData } from '@/types/creator-page';

interface LinksBlockProps {
  data: LinksBlockData | Record<string, unknown>;
  onLinkClick?: (index: number) => void;
}

export function LinksBlock({ data, onLinkClick }: LinksBlockProps) {
  const linksData = data as LinksBlockData;
  let globalIndex = 0;

  return (
    <div className="space-y-4">
      {linksData.groups?.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Group heading */}
          {group.heading && (
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {group.heading}
            </h3>
          )}

          {/* Links */}
          <div className="space-y-2">
            {group.links?.map((link) => {
              const currentIndex = globalIndex++;
              return (
                <a
                  key={currentIndex}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(currentIndex)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition group"
                >
                  <span className="text-white font-medium">{link.label}</span>
                  <ExternalLink
                    size={16}
                    className="text-gray-500 group-hover:text-gray-400 transition"
                  />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
