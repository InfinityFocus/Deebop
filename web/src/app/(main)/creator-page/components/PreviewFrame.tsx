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

    case 'testimonials': {
      const items = (data.items || []) as Array<{ authorName: string; quote: string; rating?: number }>;
      if (items.length === 0) {
        return (
          <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
            No testimonials yet
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {data.heading && (
            <h3 className="text-lg font-semibold text-white text-center">{String(data.heading)}</h3>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex-shrink-0 w-[70vw] max-w-[256px] bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.authorName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-sm font-medium text-white">{item.authorName}</div>
                {item.rating && (
                  <div className="flex justify-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= item.rating! ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 italic line-clamp-3">&quot;{item.quote}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'faq': {
      const items = (data.items || []) as Array<{ question: string; answer: string }>;
      if (items.length === 0) {
        return (
          <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
            No FAQ items yet
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {data.heading && (
            <h3 className="text-lg font-semibold text-white text-center">{String(data.heading)}</h3>
          )}
          <div className="space-y-2">
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{item.question}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-center text-xs text-gray-500">+{items.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    case 'text':
      return (
        <div className="space-y-3">
          {data.heading && (
            <h3 className={`text-lg font-semibold text-white ${data.alignment === 'center' ? 'text-center' : ''}`}>
              {String(data.heading)}
            </h3>
          )}
          <div className={`text-gray-300 text-sm leading-relaxed ${data.alignment === 'center' ? 'text-center' : ''}`}>
            {data.content ? (
              <p className="line-clamp-4">{String(data.content)}</p>
            ) : (
              <p className="text-gray-500 italic">No content yet</p>
            )}
          </div>
        </div>
      );

    case 'stats': {
      const items = (data.items || []) as Array<{ value: string; label: string }>;
      const columns = (data.columns as number) || 3;
      if (items.length === 0) {
        return (
          <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
            No stats yet
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {data.heading && (
            <h3 className="text-lg font-semibold text-white text-center">{String(data.heading)}</h3>
          )}
          <div className={`grid gap-3 sm:gap-4 ${columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {items.map((item, i) => (
              <div key={i} className="text-center py-2 sm:py-3">
                <div className="text-xl sm:text-2xl font-bold text-white truncate">{item.value}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'countdown':
      return (
        <div className="text-center py-4">
          {data.heading && (
            <h3 className="text-lg font-semibold text-white mb-4">{String(data.heading)}</h3>
          )}
          {data.targetDate ? (
            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
              {['Days', 'Hours', 'Mins', 'Secs'].map((label) => (
                <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-2 sm:p-3">
                  <div className="text-lg sm:text-xl font-bold text-white">00</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
              Set a target date
            </div>
          )}
        </div>
      );

    case 'spotify_embed':
      return (
        <div className="space-y-4">
          {data.heading && (
            <h3 className="text-lg font-semibold text-white text-center">{String(data.heading)}</h3>
          )}
          {data.spotifyUrl ? (
            <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
              <div className="w-12 h-12 bg-[#1DB954] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Spotify Embed</div>
                <div className="text-xs text-gray-400 truncate">{String(data.spotifyUrl)}</div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-xl">
              Add a Spotify link
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
