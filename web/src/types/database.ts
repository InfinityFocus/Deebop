/**
 * Database types for Supabase
 * Generated from schema - update when schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountTier = 'free' | 'creator' | 'pro' | 'teams';
export type ContentType = 'shout' | 'image' | 'video' | 'audio' | 'panorama360';
export type ProvenanceLabel = 'original' | 'ai_generated' | 'ai_assisted' | 'composite';
export type Visibility = 'public' | 'followers' | 'private' | 'unlisted';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type BoostStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled';
export type FollowRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType =
  | 'like'
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'mention'
  | 'repost'
  | 'boost_approved'
  | 'boost_rejected'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'system'
  | 'event_invite'
  | 'album_invite';
export type HeadlineStyle = 'normal' | 'news';

// Event-related types
export type EventStatus = 'scheduled' | 'cancelled' | 'completed';
export type RsvpStatus = 'attending' | 'maybe' | 'cant_make_it' | 'no_response';
export type LocationMode = 'exact' | 'area_only' | 'hidden';
export type UploadWindow = 'during_and_after' | 'after_only';
export type AlbumType = 'standard' | 'event';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          cover_image_url?: string | null;
          profile_link: string | null;
          tier: AccountTier;
          tier_expires_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          is_private: boolean;
          followers_count: number;
          following_count: number;
          posts_count: number;
          is_verified: boolean;
          is_suspended: boolean;
          suspended_reason: string | null;
          suspended_until: string | null;
          can_report: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          profile_link?: string | null;
          tier?: AccountTier;
          tier_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          is_private?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          is_verified?: boolean;
          is_suspended?: boolean;
          suspended_reason?: string | null;
          suspended_until?: string | null;
          can_report?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          profile_link?: string | null;
          tier?: AccountTier;
          tier_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          is_private?: boolean;
          is_verified?: boolean;
          is_suspended?: boolean;
          suspended_reason?: string | null;
          suspended_until?: string | null;
          can_report?: boolean;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content_type: ContentType;
          visibility: Visibility;
          headline: string | null;
          headline_style: HeadlineStyle;
          text_content: string | null;
          media_url: string | null;
          media_thumbnail_url: string | null;
          media_width: number | null;
          media_height: number | null;
          media_duration_seconds: number | null;
          media_file_size: number | null;
          panorama_default_yaw: number | null;
          panorama_default_pitch: number | null;
          panorama_auto_rotate: boolean;
          provenance: ProvenanceLabel;
          location_name: string | null;
          location_country: string | null;
          is_processing: boolean;
          processing_error: string | null;
          likes_count: number;
          saves_count: number;
          shares_count: number;
          reposts_count: number;
          views_count: number;
          is_hidden: boolean;
          hidden_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: ContentType;
          visibility?: Visibility;
          headline?: string | null;
          headline_style?: HeadlineStyle;
          text_content?: string | null;
          media_url?: string | null;
          media_thumbnail_url?: string | null;
          media_width?: number | null;
          media_height?: number | null;
          media_duration_seconds?: number | null;
          media_file_size?: number | null;
          panorama_default_yaw?: number | null;
          panorama_default_pitch?: number | null;
          panorama_auto_rotate?: boolean;
          provenance?: ProvenanceLabel;
          location_name?: string | null;
          location_country?: string | null;
          is_processing?: boolean;
          processing_error?: string | null;
        };
        Update: {
          visibility?: Visibility;
          headline?: string | null;
          headline_style?: HeadlineStyle;
          text_content?: string | null;
          media_url?: string | null;
          media_thumbnail_url?: string | null;
          media_width?: number | null;
          media_height?: number | null;
          media_duration_seconds?: number | null;
          provenance?: ProvenanceLabel;
          location_name?: string | null;
          location_country?: string | null;
          is_processing?: boolean;
          processing_error?: string | null;
          is_hidden?: boolean;
          hidden_reason?: string | null;
        };
      };
      hashtags: {
        Row: {
          id: string;
          name: string;
          posts_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          posts_count?: number;
        };
        Update: {
          name?: string;
          posts_count?: number;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: never;
      };
      likes: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
        };
        Update: never;
      };
      saves: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          actor_id: string | null;
          post_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          actor_id?: string | null;
          post_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
          read_at?: string | null;
        };
      };
    };
    Enums: {
      account_tier: AccountTier;
      content_type: ContentType;
      provenance_label: ProvenanceLabel;
      visibility: Visibility;
      report_status: ReportStatus;
      boost_status: BoostStatus;
      follow_request_status: FollowRequestStatus;
      notification_type: NotificationType;
      headline_style: HeadlineStyle;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Hashtag = Database['public']['Tables']['hashtags']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Post media for carousels (multiple images)
export interface PostMedia {
  id: string;
  media_url: string;
  thumbnail_url?: string | null;
  media_width?: number | null;
  media_height?: number | null;
  alt_text?: string | null;
  sort_order: number;
}

// Extended types with relations
export interface PostWithAuthor extends Post {
  author: Profile;
  media?: PostMedia[] | null;
}

export interface PostWithEngagement extends Post {
  author: Profile;
  isLiked?: boolean;
  isSaved?: boolean;
  media?: PostMedia[] | null;
}


// Multi-profile types
export interface Identity {
  id: string;
  email: string;
  tier: AccountTier;
  is_banned: boolean;
}

export interface ProfileSummary {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_default: boolean;
  is_suspended: boolean;
}