'use client';

import Image from 'next/image';
import type { CreatorPageBlock } from '@/types/creator-page';

interface PreviewFrameProps {
  mode: 'mobile' | 'desktop';
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    tier: string;
  } | null;
  blocks: CreatorPageBlock[];
  onBlockClick: (blockId: string) => void;
  selectedBlockId: string | null;
}

interface BlockGroup {
  type: 'single' | 'affiliate_grid';
  blocks: CreatorPageBlock[];
}

// Group consecutive affiliate cards together for grid layout
function groupBlocks(blocks: CreatorPageBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  let currentAffiliateGroup: CreatorPageBlock[] = [];

  for (const block of blocks) {
    if (block.type === 'affiliate_card') {
      currentAffiliateGroup.push(block);
    } else {
      // Flush any pending affiliate cards
      if (currentAffiliateGroup.length > 0) {
        groups.push({
          type: currentAffiliateGroup.length > 1 ? 'affiliate_grid' : 'single',
          blocks: currentAffiliateGroup,
        });
        currentAffiliateGroup = [];
      }
      groups.push({ type: 'single', blocks: [block] });
    }
  }

  // Flush remaining affiliate cards
  if (currentAffiliateGroup.length > 0) {
    groups.push({
      type: currentAffiliateGroup.length > 1 ? 'affiliate_grid' : 'single',
      blocks: currentAffiliateGroup,
    });
  }

  return groups;
}

export function PreviewFrame({
  mode,
  user,
  blocks,
  onBlockClick,
  selectedBlockId,
}: PreviewFrameProps) {
  const containerClass =
    mode === 'mobile'
      ? 'w-[375px] min-h-[667px] rounded-[3rem] border-8 border-gray-700'
      : 'w-full max-w-2xl min-h-[500px] rounded-xl border border-gray-700';

  return (
    <div className={`${containerClass} bg-gray-950 overflow-hidden`}>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh]">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 mb-2">Your page is empty</p>
            <p className="text-sm text-gray-600">Add blocks to get started</p>
          </div>
        ) : (
          groupBlocks(blocks).map((group, groupIndex) => {
            if (group.type === 'affiliate_grid') {
              // 2 cards = 2 columns, 3+ cards = 2 cols mobile / 3 cols desktop
              const gridCols = group.blocks.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 sm:grid-cols-3';
              return (
                <div key={`group-${groupIndex}`} className={`grid ${gridCols} gap-3`}>
                  {group.blocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={() => onBlockClick(block.id)}
                      className={`cursor-pointer rounded-lg transition ${
                        selectedBlockId === block.id
                          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-950'
                          : ''
                      }`}
                    >
                      <BlockPreview block={block} user={user} />
                    </div>
                  ))}
                </div>
              );
            }
            const block = group.blocks[0];
            return (
              <div
                key={block.id}
                onClick={() => onBlockClick(block.id)}
                className={`cursor-pointer rounded-lg transition ${
                  selectedBlockId === block.id
                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-950'
                    : ''
                }`}
              >
                <BlockPreview block={block} user={user} />
              </div>
            );
          })
        )}

        {/* Platform Branding */}
        <div className="pt-4 text-center">
          <span className="text-xs text-gray-600">Made with Deebop</span>
        </div>
      </div>
    </div>
  );
}

// Simple preview renderers for each block type
function BlockPreview({
  block,
  user,
}: {
  block: CreatorPageBlock;
  user: PreviewFrameProps['user'];
}) {
  const data = block.data as Record<string, any>;

  switch (block.type) {
    case 'hero':
      return (
        <div className="text-center py-6">
          {user?.avatarUrl && (
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}
          {!user?.avatarUrl && (
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-3xl text-gray-500">
                {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-xl font-bold text-white">
            {user?.displayName || user?.username || 'Your Name'}
          </h1>
          {data.headline && (
            <p className="text-gray-400 mt-1">{String(data.headline)}</p>
          )}
          {(data.bio || user?.bio) && (
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              {String(data.bio || user?.bio)}
            </p>
          )}
          {data.ctaUrl && data.ctaLabel && (
            <button className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-full font-medium">
              {String(data.ctaLabel)}
            </button>
          )}
        </div>
      );

    case 'card':
      return (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          {data.imageUrl && (
            <div className="relative w-full aspect-video bg-gray-700">
              <Image
                src={String(data.imageUrl)}
                alt={String(data.title || '')}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-white">{String(data.title || 'Card Title')}</h3>
            {data.description && (
              <p className="text-gray-400 text-sm mt-1">{String(data.description)}</p>
            )}
            {data.ctaUrl && (
              <button
                className={`mt-3 w-full py-2 rounded-lg font-medium ${
                  data.highlight
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {String(data.ctaLabel || 'Learn More')}
              </button>
            )}
          </div>
        </div>
      );

    case 'links': {
      const groups = (data.groups || []) as Array<{
        heading?: string;
        links: Array<{ label: string; url: string }>;
      }>;
      return (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.heading && (
                <h3 className="text-sm font-semibold text-gray-400 mb-2">
                  {group.heading}
                </h3>
              )}
              <div className="space-y-2">
                {group.links.map((link, li) => (
                  <div
                    key={li}
                    className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-center transition border border-gray-700"
                  >
                    {link.label || 'Link'}
                  </div>
                ))}
                {group.links.length === 0 && (
                  <div className="py-3 px-4 bg-gray-800/50 border border-dashed border-gray-700 rounded-xl text-gray-500 text-center text-sm">
                    No links yet
                  </div>
                )}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="py-3 px-4 bg-gray-800/50 border border-dashed border-gray-700 rounded-xl text-gray-500 text-center text-sm">
              No link groups yet
            </div>
          )}
        </div>
      );
    }

    case 'social_links': {
      const links = (data.links || []) as Array<{ platform: string; url: string }>;
      if (links.length === 0) {
        return (
          <div className="py-3 text-center text-gray-500 text-sm">
            No social links yet
          </div>
        );
      }
      return (
        <div className="flex justify-center gap-3">
          {links.map((link, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 border border-gray-700"
            >
              {link.platform[0].toUpperCase()}
            </div>
          ))}
        </div>
      );
    }

    case 'affiliate_card':
      return (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
            <span className="text-xs font-semibold text-amber-400 uppercase">
              Affiliate
            </span>
          </div>
          {data.imageUrl && (
            <div className="relative w-full aspect-video bg-gray-700">
              <Image
                src={String(data.imageUrl)}
                alt={String(data.title || '')}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-white">{String(data.title || 'Product Name')}</h3>
            {data.description && (
              <p className="text-gray-400 text-sm mt-1">{String(data.description)}</p>
            )}
            {data.priceNote && (
              <p className="text-emerald-400 font-semibold mt-1">{String(data.priceNote)}</p>
            )}
            {data.couponCode && (
              <div className="mt-2 p-2 bg-gray-900 rounded border border-dashed border-gray-600">
                <span className="text-xs text-gray-500">Code: </span>
                <span className="font-mono text-white">{String(data.couponCode)}</span>
              </div>
            )}
            <button className="mt-3 w-full py-2 bg-amber-500 text-black rounded-lg font-medium">
              {String(data.ctaLabel || 'Shop Now')}
            </button>
          </div>
        </div>
      );

    case 'email_capture':
      return (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          {data.heading && (
            <h3 className="font-semibold text-white text-center mb-1">
              {String(data.heading)}
            </h3>
          )}
          {data.description && (
            <p className="text-gray-400 text-sm text-center mb-3">
              {String(data.description)}
            </p>
          )}
          <input
            type="email"
            placeholder={String(data.placeholder || 'Enter your email')}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white mb-2"
            disabled
          />
          <button className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium">
            {String(data.buttonLabel || 'Subscribe')}
          </button>
        </div>
      );

    case 'divider': {
      const style = data.style || 'space';
      const height = data.height || 'medium';
      const heightClass = { small: 'h-4', medium: 'h-8', large: 'h-12' }[
        height as string
      ];

      if (style === 'line') {
        return (
          <div className={`${heightClass} flex items-center`}>
            <div className="w-full border-t border-gray-700" />
          </div>
        );
      }
      if (style === 'dots') {
        return (
          <div className={`${heightClass} flex items-center justify-center gap-2`}>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>
        );
      }
      return <div className={heightClass} />;
    }

    case 'featured_content': {
      const items = (data.items || []) as Array<{ type: string; id: string }>;
      if (items.length === 0) {
        return (
          <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
            No featured content yet
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.slice(0, 6).map((item, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center"
            >
              <span className="text-xs text-gray-500 capitalize">{item.type}</span>
            </div>
          ))}
        </div>
      );
    }

    default:
      return (
        <div className="p-4 bg-gray-800 rounded-lg text-gray-500 text-center">
          Unknown block type
        </div>
      );
  }
}
