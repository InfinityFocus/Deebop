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
  // On actual mobile devices, show full-width preview without phone bezel
  // On desktop, show the selected preview mode (mobile with bezel or desktop full-width)
  const containerClass =
    mode === 'mobile'
      ? 'w-full md:w-[375px] min-h-[500px] md:min-h-[667px] md:rounded-[3rem] md:border-8 md:border-gray-700 rounded-xl border border-gray-800'
      : 'w-full max-w-2xl min-h-[500px] rounded-xl border border-gray-700';

  return (
    <div className={`${containerClass} bg-gray-950 overflow-hidden`}>
      <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh] md:max-h-[80vh]">
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

    case 'booking':
      return (
        <div
          className={`bg-gray-800 rounded-xl p-4 border ${
            data.highlight ? 'border-emerald-500' : 'border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {String(data.title || 'Book a Session')}
              </h3>
              {data.description && (
                <p className="text-gray-400 text-sm">{String(data.description)}</p>
              )}
            </div>
          </div>
          {data.mode === 'embed' ? (
            <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-500 text-sm">
              Booking widget preview
            </div>
          ) : (
            <button
              className={`w-full py-2 rounded-lg font-medium ${
                data.highlight
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {String(data.ctaLabel || 'Book Now')}
            </button>
          )}
        </div>
      );

    case 'intro_video':
      return (
        <div
          className={`bg-gray-800 rounded-xl overflow-hidden border ${
            data.highlight ? 'border-emerald-500' : 'border-gray-700'
          }`}
        >
          {/* Video Preview */}
          <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center">
            {data.videoUrl ? (
              <video
                src={String(data.videoUrl)}
                poster={data.posterUrl ? String(data.posterUrl) : undefined}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-500">No video uploaded</span>
              </div>
            )}
            {data.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          {/* Content */}
          {(data.title || data.description || data.ctaLabel) && (
            <div className="p-4">
              {data.title && (
                <h3 className="font-semibold text-white">{String(data.title)}</h3>
              )}
              {data.description && (
                <p className="text-gray-400 text-sm mt-1">{String(data.description)}</p>
              )}
              {data.ctaLabel && data.ctaUrl && (
                <button
                  className={`mt-3 w-full py-2 rounded-lg font-medium ${
                    data.highlight
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {String(data.ctaLabel)}
                </button>
              )}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-800 rounded-lg text-gray-500 text-center">
          Unknown block type
        </div>
      );
  }
}
