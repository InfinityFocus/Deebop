import { ContentType, ProvenanceLabel, Visibility } from './database';

export type AlbumRole = 'owner' | 'co_owner' | 'contributor';
export type AlbumInviteStatus = 'pending' | 'accepted' | 'declined';

// Basic user info for album contexts
export interface AlbumUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Event attendee info with RSVP timestamp
export interface EventAttendee extends AlbumUser {
  rsvp_at: string;
}

// Event attendees grouped by RSVP status
export interface EventAttendees {
  attending: EventAttendee[];
  maybe: EventAttendee[];
}

// Album item (individual media piece)
export interface AlbumItem {
  id: string;
  content_type: ContentType;
  media_url: string;
  thumbnail_url: string | null;
  media_width: number | null;
  media_height: number | null;
  caption: string | null;
  provenance: ProvenanceLabel;
  sort_order: number;
  created_at: string;
  uploader: AlbumUser;
}

// Album member with role
export interface AlbumMember {
  id: string;
  role: AlbumRole;
  joined_at: string;
  user: AlbumUser;
}

// Album invite
export interface AlbumInvite {
  id: string;
  role: AlbumRole;
  message: string | null;
  status: AlbumInviteStatus;
  created_at: string;
  responded_at: string | null;
  album: {
    id: string;
    title: string;
    cover_image_url: string | null;
    items_count: number;
    members_count: number;
    owner: AlbumUser;
  };
  inviter: AlbumUser;
}

// Album card for feed/list display
export interface AlbumCard {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: Visibility;
  location: string | null;
  items_count: number;
  members_count: number;
  likes_count: number;
  saves_count: number;
  created_at: string;
  owner: AlbumUser;
  preview_members: AlbumUser[];
  preview_items: {
    id: string;
    thumbnail_url: string | null;
  }[];
  is_liked: boolean;
  is_saved: boolean;
}

// Full album detail
export interface Album extends AlbumCard {
  views_count: number;
  updated_at: string;
  hashtags: string[];
  members: AlbumMember[];
  items: AlbumItem[];
  user_role: AlbumRole | null;
  // Event album properties
  linked_event_id: string | null;
  can_upload_to_event: boolean | null;
  event_host: AlbumUser | null;
  event_attendees: EventAttendees | null;
  can_view_attendee_list: boolean;
}

// Album creation/update payloads
export interface CreateAlbumPayload {
  title: string;
  description?: string;
  visibility?: Visibility;
  location?: string;
  hashtags?: string[];
  audienceUserIds?: string[];
  audienceGroupIds?: string[];
  scheduledFor?: string;
  hideTeaser?: boolean;
}

export interface UpdateAlbumPayload {
  title?: string;
  description?: string;
  visibility?: Visibility;
  location?: string;
  coverImageUrl?: string;
  hashtags?: string[];
}

// API response types
export interface AlbumsResponse {
  albums: AlbumCard[];
  nextCursor?: string;
}

export interface AlbumResponse {
  album: Album;
}

export interface AlbumItemsResponse {
  items: AlbumItem[];
  nextCursor?: string;
}

export interface AlbumMembersResponse {
  members: AlbumMember[];
}

export interface AlbumInvitesResponse {
  invites: AlbumInvite[];
}
