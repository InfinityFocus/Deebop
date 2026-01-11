'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { HeroBlock } from './blocks/HeroBlock';
import { CardBlock } from './blocks/CardBlock';
import { LinksBlock } from './blocks/LinksBlock';
import { SocialLinksBlock } from './blocks/SocialLinksBlock';
import { AffiliateCardBlock } from './blocks/AffiliateCardBlock';
import { EmailCaptureBlock } from './blocks/EmailCaptureBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { FeaturedContentBlock } from './blocks/FeaturedContentBlock';
import { BookingBlock } from './blocks/BookingBlock';
import { IntroVideoBlock } from './blocks/IntroVideoBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { FAQBlock } from './blocks/FAQBlock';
import { TextBlock } from './blocks/TextBlock';
import { StatsBlock } from './blocks/StatsBlock';
import { CountdownBlock } from './blocks/CountdownBlock';
import { SpotifyEmbedBlock } from './blocks/SpotifyEmbedBlock';
import type { BlockType, BlockData } from '@/types/creator-page';

interface CreatorPageBlock {
  id: string;
  type: string;
  sortOrder: number;
  data: Record<string, unknown>;
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

interface CreatorPageRendererProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    tier: string;
  };
  page: {
    id: string;
    status: string;
    themeId: string | null;
    hideBranding: boolean;
    blocks: CreatorPageBlock[];
  };
}

export function CreatorPageRenderer({ user, page }: CreatorPageRendererProps) {
  const hasTrackedView = useRef(false);

  // Track page view on mount
  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('creator-page-session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('creator-page-session', sessionId);
    }

    // Track view
    fetch('/api/creator-page/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, sessionId }),
    }).catch(() => {
      // Silently fail - analytics shouldn't break the page
    });
  }, [page.id]);

  // Track click handler
  const handleClick = (blockId: string, linkIndex?: number) => {
    fetch('/api/creator-page/track/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, blockId, linkIndex }),
    }).catch(() => {
      // Silently fail
    });
  };

  // Render block by type
  const renderBlock = (block: CreatorPageBlock) => {
    const data = block.data as any;

    switch (block.type as BlockType) {
      case 'hero':
        return (
          <HeroBlock
            key={block.id}
            data={data}
            user={user}
            onCtaClick={() => handleClick(block.id)}
          />
        );

      case 'featured_content':
        return (
          <FeaturedContentBlock
            key={block.id}
            data={data}
            onItemClick={(index) => handleClick(block.id, index)}
          />
        );

      case 'card':
        return (
          <CardBlock
            key={block.id}
            data={data}
            onClick={() => handleClick(block.id)}
          />
        );

      case 'links':
        return (
          <LinksBlock
            key={block.id}
            data={data}
            onLinkClick={(index) => handleClick(block.id, index)}
          />
        );

      case 'social_links':
        return (
          <SocialLinksBlock
            key={block.id}
            data={data}
            onLinkClick={(index) => handleClick(block.id, index)}
          />
        );

      case 'affiliate_card':
        return (
          <AffiliateCardBlock
            key={block.id}
            data={data}
            onClick={() => handleClick(block.id)}
          />
        );

      case 'email_capture':
        return (
          <EmailCaptureBlock
            key={block.id}
            data={data}
            pageId={page.id}
          />
        );

      case 'divider':
        return <DividerBlock key={block.id} data={data} />;

      case 'booking':
        return (
          <BookingBlock
            key={block.id}
            data={data}
            onClick={() => handleClick(block.id)}
          />
        );

      case 'intro_video':
        return (
          <IntroVideoBlock
            key={block.id}
            data={data}
            onClick={() => handleClick(block.id)}
          />
        );

      case 'testimonials':
        return <TestimonialsBlock key={block.id} data={data} />;

      case 'faq':
        return <FAQBlock key={block.id} data={data} />;

      case 'text':
        return <TextBlock key={block.id} data={data} />;

      case 'stats':
        return <StatsBlock key={block.id} data={data} />;

      case 'countdown':
        return <CountdownBlock key={block.id} data={data} />;

      case 'spotify_embed':
        return <SpotifyEmbedBlock key={block.id} data={data} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      {/* Main content - centered, matches user profile width */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 overflow-x-hidden">
        {/* View Profile Link */}
        <div className="flex justify-end mb-4">
          <Link
            href={`/u/${user.username}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-800"
          >
            <User size={16} />
            View Profile
          </Link>
        </div>

        {/* Blocks */}
        <div className="space-y-6">
          {groupBlocks(page.blocks).map((group, groupIndex) => {
            if (group.type === 'affiliate_grid') {
              // 2 cards = 2 columns, 3+ cards = 2 cols mobile / 3 cols desktop
              const gridCols = group.blocks.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3';
              return (
                <div key={`group-${groupIndex}`} className={`grid ${gridCols} gap-4`}>
                  {group.blocks.map(renderBlock)}
                </div>
              );
            }
            return renderBlock(group.blocks[0]);
          })}
        </div>
      </div>

      {/* Platform branding footer (unless hidden by Pro) */}
      {!page.hideBranding && (
        <div className="fixed bottom-0 left-0 right-0 py-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent pointer-events-none">
          <div className="text-center pointer-events-auto">
            <a
              href="https://deebop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-400 transition"
            >
              Made with Deebop
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
