export type EmbedTheme = 'dark' | 'light';

export type EmbedContentType =
  | 'shout'
  | 'image'
  | 'video'
  | 'audio'
  | 'panorama360'
  | 'all';

export type EmbedLayout = 'vertical' | 'horizontal';

export interface EmbedConfig {
  theme: EmbedTheme;
  width: string;
  height: string;
  backgroundColor?: string;
  accentColor?: string;
  showEngagement: boolean;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
}

export interface FeedEmbedConfig extends EmbedConfig {
  type: 'feed';
  username: string;
  limit: number;
  contentType: EmbedContentType;
  layout: EmbedLayout;
}

export interface PostEmbedConfig extends EmbedConfig {
  type: 'post';
  postId: string;
}

export type EmbedConfigUnion = FeedEmbedConfig | PostEmbedConfig;

export interface EmbedPost {
  id: string;
  content_type: 'shout' | 'image' | 'video' | 'audio' | 'panorama360';
  headline: string | null;
  headline_style: 'normal' | 'news';
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_duration_seconds: number | null;
  media_waveform_url?: string | null;
  media_width?: number | null;
  media_height?: number | null;
  provenance: string;
  likes_count: number;
  reposts_count: number;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  media?: Array<{
    id: string;
    media_url: string;
    thumbnail_url?: string | null;
    sort_order: number;
  }> | null;
}

export interface EmbedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'creator' | 'pro' | 'teams';
  is_private: boolean;
}

export interface EmbedFeedResponse {
  user: EmbedUser;
  posts: EmbedPost[];
  nextCursor?: string;
}

export interface EmbedPostResponse {
  post: EmbedPost;
  author: EmbedUser;
}

// CSS variable names for theming
export const EMBED_CSS_VARS = {
  background: '--embed-bg',
  foreground: '--embed-fg',
  accent: '--embed-accent',
  muted: '--embed-muted',
  border: '--embed-border',
} as const;

// Default theme values
export const EMBED_THEME_DEFAULTS = {
  dark: {
    background: '#111827',
    foreground: '#ffffff',
    accent: '#10b981',
    muted: '#6b7280',
    border: '#374151',
  },
  light: {
    background: '#ffffff',
    foreground: '#111827',
    accent: '#10b981',
    muted: '#6b7280',
    border: '#e5e7eb',
  },
} as const;

// Parse embed config from URL search params
export function parseEmbedParams(searchParams: URLSearchParams): Partial<EmbedConfig> & { limit?: number; contentType?: EmbedContentType; layout?: EmbedLayout } {
  const theme = searchParams.get('theme') as EmbedTheme | null;
  const bg = searchParams.get('bg');
  const accent = searchParams.get('accent');
  const w = searchParams.get('w');
  const h = searchParams.get('h');
  const limit = searchParams.get('limit');
  const type = searchParams.get('type') as EmbedContentType | null;
  const layout = searchParams.get('layout') as EmbedLayout | null;
  const borderRadius = searchParams.get('br');
  const borderWidth = searchParams.get('bw');
  const borderColor = searchParams.get('bc');

  return {
    theme: theme === 'light' ? 'light' : 'dark',
    backgroundColor: bg ? decodeURIComponent(bg) : undefined,
    accentColor: accent ? decodeURIComponent(accent) : undefined,
    width: w || '100%',
    height: h || '600px',
    showEngagement: true,
    limit: limit ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50) : 10,
    contentType: type || 'all',
    layout: layout === 'horizontal' ? 'horizontal' : 'vertical',
    borderRadius: borderRadius ? decodeURIComponent(borderRadius) : undefined,
    borderWidth: borderWidth ? decodeURIComponent(borderWidth) : undefined,
    borderColor: borderColor ? decodeURIComponent(borderColor) : undefined,
  };
}

// Generate embed URL from config
export function generateEmbedUrl(config: EmbedConfigUnion, baseUrl: string): string {
  const params = new URLSearchParams();

  if (config.theme !== 'dark') params.set('theme', config.theme);
  if (config.backgroundColor) params.set('bg', encodeURIComponent(config.backgroundColor));
  if (config.accentColor) params.set('accent', encodeURIComponent(config.accentColor));
  if (config.width !== '100%') params.set('w', config.width);
  if (config.height !== '600px') params.set('h', config.height);
  if (config.borderRadius) params.set('br', encodeURIComponent(config.borderRadius));
  if (config.borderWidth) params.set('bw', encodeURIComponent(config.borderWidth));
  if (config.borderColor) params.set('bc', encodeURIComponent(config.borderColor));

  if (config.type === 'feed') {
    if (config.limit !== 10) params.set('limit', String(config.limit));
    if (config.contentType !== 'all') params.set('type', config.contentType);
    if (config.layout === 'horizontal') params.set('layout', 'horizontal');
    const path = `/embed/u/${config.username}`;
    return params.toString() ? `${baseUrl}${path}?${params}` : `${baseUrl}${path}`;
  } else {
    const path = `/embed/p/${config.postId}`;
    return params.toString() ? `${baseUrl}${path}?${params}` : `${baseUrl}${path}`;
  }
}

// Generate iframe HTML code
export function generateEmbedCode(config: EmbedConfigUnion, baseUrl: string): string {
  const src = generateEmbedUrl(config, baseUrl);
  const title = config.type === 'feed'
    ? `@${config.username}'s Deebop feed`
    : 'Deebop post';

  // Build style attribute for border customization
  const styles: string[] = [];
  if (config.borderRadius) styles.push(`border-radius: ${config.borderRadius}`);
  if (config.borderWidth && config.borderWidth !== '0') {
    const borderColor = config.borderColor || (config.theme === 'dark' ? '#374151' : '#e5e7eb');
    styles.push(`border: ${config.borderWidth} solid ${borderColor}`);
  }
  const styleAttr = styles.length > 0 ? `\n  style="${styles.join('; ')}"` : '';

  return `<iframe
  src="${src}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"${styleAttr}
  allow="autoplay; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-popups"
  loading="lazy"
  title="${title}"
></iframe>`;
}
