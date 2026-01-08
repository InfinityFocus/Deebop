'use client';

import Link from 'next/link';
import { Repeat } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostCard } from './PostCard';
import type { ContentType, HeadlineStyle, Visibility } from '@/types/database';

interface Reposter {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: string;
  allow_reposts?: boolean;
}

interface RepostedPost {
  type: 'repost';
  id: string;
  repost_id: string;
  original_post_id: string; // For chain reposting - this is the ID to use when reposting
  reposter: Reposter;
  reposted_at: string;
  post_id: string;
  user_id: string;
  content_type: ContentType;
  headline: string | null;
  headline_style: HeadlineStyle;
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_waveform_url?: string | null;
  media_width: number | null;
  media_height: number | null;
  media_duration_seconds: number | null;
  visibility: Visibility;
  provenance: string;
  status: string;
  dropped_at: string | null;
  is_sponsored_content: boolean;
  is_sensitive_content: boolean;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  reposts_count: number;
  views_count: number;
  created_at: string;
  author: PostAuthor;
  is_liked: boolean;
  is_saved: boolean;
  is_following: boolean;
  is_reposted: boolean;
  repost_status: string | null;
  can_repost: boolean;
}

interface RepostedPostCardProps {
  repost: RepostedPost;
}

export function RepostedPostCard({ repost }: RepostedPostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(repost.reposted_at), { addSuffix: true });

  // Convert to PostCard format
  const post = {
    id: repost.post_id,
    user_id: repost.user_id,
    content_type: repost.content_type,
    headline: repost.headline,
    headline_style: repost.headline_style,
    text_content: repost.text_content,
    media_url: repost.media_url,
    media_thumbnail_url: repost.media_thumbnail_url,
    media_waveform_url: repost.media_waveform_url || null,
    media_width: repost.media_width,
    media_height: repost.media_height,
    media_duration_seconds: repost.media_duration_seconds,
    provenance: repost.provenance,
    likes_count: repost.likes_count,
    saves_count: repost.saves_count,
    shares_count: repost.shares_count,
    reposts_count: repost.reposts_count,
    views_count: repost.views_count,
    created_at: repost.created_at,
    author: repost.author,
    is_liked: repost.is_liked,
    is_saved: repost.is_saved,
    is_following: repost.is_following,
    is_sponsored_content: repost.is_sponsored_content,
    is_sensitive_content: repost.is_sensitive_content,
    visibility: repost.visibility,
    is_reposted: repost.is_reposted,
    repost_status: repost.repost_status,
    can_repost: repost.can_repost,
  };

  return (
    <div className="relative">
      {/* Repost header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 border-b-0 rounded-t-xl">
        <Repeat size={14} className="text-emerald-400" />
        <Link
          href={`/u/${repost.reposter.username}`}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          <span className="font-medium text-emerald-400">
            {repost.reposter.display_name || `@${repost.reposter.username}`}
          </span>{' '}
          reposted
        </Link>
        <span className="text-xs text-gray-500">· {timeAgo}</span>
      </div>

      {/* Original post */}
      <div className="[&>article]:rounded-t-none [&>article]:border-t-0">
        <PostCard post={post} originalPostId={repost.original_post_id} />
      </div>
    </div>
  );
}
