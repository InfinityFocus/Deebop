'use client';

import {
  User,
  Image,
  Link2,
  Share2,
  Tag,
  Mail,
  Minus,
  Grid,
  X,
  Calendar,
  Video,
  Quote,
  HelpCircle,
  FileText,
  BarChart3,
  Timer,
  Music,
} from 'lucide-react';
import type { BlockType } from '@/types/creator-page';
import { getLimitsForTier } from '@/lib/creator-page-limits';

interface BlockTypeMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  currentBlockCount: number;
  userTier: string;
}

const BLOCK_TYPES: Array<{
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Profile header with avatar, name, and CTA',
    icon: User,
  },
  {
    type: 'featured_content',
    label: 'Featured Content',
    description: 'Showcase your posts, albums, events, or drops',
    icon: Grid,
  },
  {
    type: 'card',
    label: 'Card',
    description: 'Image card with title and CTA button',
    icon: Image,
  },
  {
    type: 'links',
    label: 'Links',
    description: 'Group of clickable link buttons',
    icon: Link2,
  },
  {
    type: 'social_links',
    label: 'Social Links',
    description: 'Social media icon row',
    icon: Share2,
  },
  {
    type: 'affiliate_card',
    label: 'Affiliate Card',
    description: 'Product card with affiliate disclosure',
    icon: Tag,
  },
  {
    type: 'email_capture',
    label: 'Email Capture',
    description: 'Newsletter signup form',
    icon: Mail,
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Space or line separator',
    icon: Minus,
  },
  {
    type: 'booking',
    label: 'Booking',
    description: 'Booking link or embed (Calendly, Acuity, etc.)',
    icon: Calendar,
  },
  {
    type: 'intro_video',
    label: 'Intro Video',
    description: 'Video card with optional title and CTA',
    icon: Video,
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Showcase reviews and testimonials',
    icon: Quote,
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Collapsible Q&A accordion',
    icon: HelpCircle,
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Rich text content section',
    icon: FileText,
  },
  {
    type: 'stats',
    label: 'Stats',
    description: 'Display achievement numbers',
    icon: BarChart3,
  },
  {
    type: 'countdown',
    label: 'Countdown',
    description: 'Timer for launches or events',
    icon: Timer,
  },
  {
    type: 'spotify_embed',
    label: 'Spotify',
    description: 'Embed tracks, albums, or playlists',
    icon: Music,
  },
];

export function BlockTypeMenu({
  onSelect,
  onClose,
  currentBlockCount,
  userTier,
}: BlockTypeMenuProps) {
  const limits = getLimitsForTier(userTier);
  const maxBlocks = limits?.maxBlocks ?? 10;
  const canAddMore = currentBlockCount < maxBlocks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Add Block</h2>
            <p className="text-sm text-gray-500">
              {currentBlockCount} / {maxBlocks} blocks used
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Block Types */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {!canAddMore && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                You&apos;ve reached the maximum number of blocks ({maxBlocks}).
                {userTier === 'standard' && ' Upgrade to Pro for more blocks.'}
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {BLOCK_TYPES.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  onClick={() => onSelect(blockType.type)}
                  disabled={!canAddMore}
                  className="flex items-start gap-3 p-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed border border-gray-700 rounded-xl text-left transition"
                >
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Icon size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{blockType.label}</h3>
                    <p className="text-sm text-gray-500">{blockType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
