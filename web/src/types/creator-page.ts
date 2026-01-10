// Creator Page Types
// Block data structures for the bio link landing page

export type BlockType =
  | 'hero'
  | 'featured_content'
  | 'card'
  | 'links'
  | 'social_links'
  | 'affiliate_card'
  | 'email_capture'
  | 'divider'
  | 'booking';

// Hero Block - Avatar, name, bio, and primary CTA
export interface HeroBlockData {
  headline?: string;           // Optional tagline under name
  bio?: string;                // Short bio (defaults to profile bio if not set)
  ctaLabel?: string;           // "Book Now", "Contact", "Shop", etc.
  ctaUrl?: string;             // URL for CTA button
  showSocialIcons?: boolean;   // Show social icons row
  alignment?: 'center' | 'left'; // Pro only: layout alignment
}

// Featured Content Block - Showcase platform content
export interface FeaturedContentBlockData {
  items: Array<{
    type: 'post' | 'album' | 'event' | 'drop';
    id: string;
  }>;
  // Max 6 items, visibility rules enforced at render time
}

// Card Block - Custom CTA card with image
export interface CardBlockData {
  imageUrl?: string;           // Optional card image
  title: string;               // Card title
  description?: string;        // Short description
  ctaLabel: string;            // Button label
  ctaUrl: string;              // Button URL
  highlight?: boolean;         // Visual emphasis toggle
}

// Links Block - Grouped link buttons
export interface LinksBlockData {
  groups: Array<{
    heading?: string;          // Optional group heading ("Work", "Social", etc.)
    links: Array<{
      label: string;           // Link label
      url: string;             // Link URL
      icon?: string;           // Optional icon name
    }>;
  }>;
}

// Social Links Block - Predefined social platform icons
export type SocialPlatform = 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'x' | 'website' | 'spotify' | 'soundcloud' | 'twitch' | 'discord' | 'github' | 'email';

export interface SocialLinksBlockData {
  links: Array<{
    platform: SocialPlatform;
    url: string;
  }>;
}

// Affiliate Card Block - Card with affiliate disclosure
export interface AffiliateCardBlockData {
  imageUrl?: string;
  title: string;
  description?: string;
  ctaLabel: string;
  ctaUrl: string;
  couponCode?: string;         // Optional coupon code to display
  priceNote?: string;          // "20% off", "$10/month", etc.
  // Always shows "Affiliate" badge - not optional
}

// Email Capture Block - Mailing list signup
export interface EmailCaptureBlockData {
  heading?: string;            // "Join my newsletter"
  description?: string;        // Brief description
  buttonLabel?: string;        // "Subscribe", "Sign Up", etc. (default: "Subscribe")
  consentText: string;         // Required consent checkbox text
  placeholder?: string;        // Email input placeholder
}

// Divider Block - Layout helper
export interface DividerBlockData {
  style?: 'line' | 'space' | 'dots';
  height?: 'small' | 'medium' | 'large'; // Space height
}

// Booking Block - External scheduling link or embed
export type BookingPlatform = 'acuity' | 'calendly' | 'calcom' | 'tidycal' | 'setmore' | 'youcanbookme' | 'other';

export interface BookingBlockData {
  platform: BookingPlatform;       // Platform for icon/branding
  mode: 'link' | 'embed';          // Link out vs iframe embed
  title: string;                   // "Book a Session", "Schedule a Call"
  description?: string;            // Optional subtitle
  url: string;                     // Booking URL (external or embed)
  embedHeight?: number;            // iframe height in pixels (embed mode only, default 600)
  ctaLabel?: string;               // "Book Now", "Schedule" (link mode only)
  highlight?: boolean;             // Visual emphasis toggle
}

// Union type for all block data
export type BlockData =
  | HeroBlockData
  | FeaturedContentBlockData
  | CardBlockData
  | LinksBlockData
  | SocialLinksBlockData
  | AffiliateCardBlockData
  | EmailCaptureBlockData
  | DividerBlockData
  | BookingBlockData;

// Block with type discriminator
export interface CreatorPageBlock {
  id: string;
  type: BlockType;
  sortOrder: number;
  data: BlockData;
}

// Creator Page status
export type CreatorPageStatus = 'draft' | 'published';

// Full Creator Page
export interface CreatorPage {
  id: string;
  userId: string;
  status: CreatorPageStatus;
  themeId?: string;
  hideBranding: boolean;
  publishedAt?: Date;
  blocks: CreatorPageBlock[];
}

// API Response types
export interface CreatorPageResponse {
  page: CreatorPage | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    tier: string;
  };
}

// Analytics types
export interface CreatorPageAnalytics {
  views: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
  clicks: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
  topLinks: Array<{
    blockId: string;
    linkIndex?: number;
    label: string;
    clicks: number;
    ctr?: number; // Pro only
  }>;
  topReferrers?: Array<{  // Pro only
    referrer: string;
    count: number;
  }>;
}

// Social platform metadata for rendering
export const SOCIAL_PLATFORMS: Record<SocialPlatform, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'Instagram', color: '#E4405F' },
  youtube: { label: 'YouTube', icon: 'Youtube', color: '#FF0000' },
  tiktok: { label: 'TikTok', icon: 'Music2', color: '#000000' },
  linkedin: { label: 'LinkedIn', icon: 'Linkedin', color: '#0A66C2' },
  x: { label: 'X', icon: 'Twitter', color: '#000000' },
  website: { label: 'Website', icon: 'Globe', color: '#6B7280' },
  spotify: { label: 'Spotify', icon: 'Music', color: '#1DB954' },
  soundcloud: { label: 'SoundCloud', icon: 'Cloud', color: '#FF5500' },
  twitch: { label: 'Twitch', icon: 'Twitch', color: '#9146FF' },
  discord: { label: 'Discord', icon: 'MessageCircle', color: '#5865F2' },
  github: { label: 'GitHub', icon: 'Github', color: '#181717' },
  email: { label: 'Email', icon: 'Mail', color: '#6B7280' },
};

// Booking platform metadata for rendering
export const BOOKING_PLATFORMS: Record<BookingPlatform, { label: string; color: string; urlPattern?: RegExp }> = {
  acuity: { label: 'Acuity Scheduling', color: '#0066CC', urlPattern: /acuityscheduling\.com/ },
  calendly: { label: 'Calendly', color: '#006BFF', urlPattern: /calendly\.com/ },
  calcom: { label: 'Cal.com', color: '#111827', urlPattern: /cal\.com/ },
  tidycal: { label: 'TidyCal', color: '#4F46E5', urlPattern: /tidycal\.com/ },
  setmore: { label: 'Setmore', color: '#00C389', urlPattern: /setmore\.com/ },
  youcanbookme: { label: 'YouCanBook.me', color: '#5A67D8', urlPattern: /youcanbook\.me/ },
  other: { label: 'Book', color: '#6B7280' },
};
