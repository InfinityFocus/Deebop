// Interest types
export interface Interest {
  id: string;
  name: string;
  slug: string;
  category: string;
  iconEmoji: string | null;
}

export interface InterestWithChildren extends Interest {
  children: Interest[];
}

export interface InterestsByCategory {
  [category: string]: InterestWithChildren[];
}

// City types
export interface City {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  population?: number;
}

// User content preferences
export interface ContentPreferences {
  hideAiGenerated: boolean;
  hideAiAssisted: boolean;
  hidePaidPartnership: boolean;
  hideSensitiveContent: boolean;
  boostNewsHeadlines: boolean;
  applyToDiscoveryFeed: boolean;
}

// Recent search
export interface RecentSearch {
  id: string;
  query: string;
  type: 'all' | 'hashtag' | 'creator' | 'album' | 'event' | 'shout';
  createdAt: string;
}

// Search result types
export interface HashtagResult {
  tag: string;
  postCount: number;
}

export interface CreatorResult {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  followerCount: number;
  bio?: string | null;
  recentFollowerGain?: number;
  postCount?: number;
  trendingScore?: number;
}

export interface AlbumResult {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  itemCount: number;
  memberCount?: number;
  creator: {
    username: string;
    displayName: string | null;
  };
  recentSaves?: number;
  recentShares?: number;
  trendingScore?: number;
}

export interface EventResult {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startDate: string;
  endDate?: string | null;
  location: string | null;
  isOnline?: boolean;
  attendingCount: number;
  maybeCount?: number;
  totalInterested?: number;
  daysUntil?: number;
  host?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  trendingScore?: number;
}

export interface ShoutResult {
  id: string;
  textContent: string | null;
  createdAt: string;
  likeCount: number;
  user: {
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface PostResult {
  id: string;
  headline: string | null;
  textContent: string | null;
  contentType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  likeCount: number;
  shareCount?: number;
  saveCount?: number;
  viewCount?: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  trendingScore?: number;
}

export interface SearchResults {
  hashtags?: HashtagResult[];
  creators?: CreatorResult[];
  albums?: AlbumResult[];
  events?: EventResult[];
  shouts?: ShoutResult[];
}

// Search tab type
export type SearchTab = 'all' | 'hashtag' | 'creator' | 'album' | 'event' | 'shout';

// Near you tab type
export type NearYouTab = 'posts' | 'events' | 'creators' | 'all';
