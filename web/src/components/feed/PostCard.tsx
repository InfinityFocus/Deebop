'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Bookmark, Share2, MoreHorizontal, Sparkles, Crown, Rocket, Flag, Pencil, Loader2, Music, Trash2, Repeat } from 'lucide-react';
import { PanoramaViewer } from '@/components/viewers/PanoramaViewer';
import { AudioPlayer } from '@/components/audio';
import { BoostPostModal } from '@/components/ads';
import { ReportModal } from '@/components/moderation/ReportModal';
import { EditPostModal } from '@/components/post/EditPostModal';
import { DeletePostModal } from '@/components/post/DeletePostModal';
import { HeadlineOverlay } from '@/components/shared/HeadlineOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useAudioPlayerStore } from '@/stores/audioPlayerStore';
import { renderRichText } from '@/lib/text-utils';
import { clsx } from 'clsx';
import type { ContentType, HeadlineStyle, Visibility } from '@/types/database';

interface PostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: string;
}

interface Post {
  id: string;
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
  provenance: string;
  is_flagged?: boolean;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  reposts_count?: number;
  views_count: number;
  created_at: string;
  author: PostAuthor;
  is_liked: boolean;
  is_saved: boolean;
  is_following?: boolean;
  is_sponsored_content?: boolean;
  is_sensitive_content?: boolean;
  visibility?: Visibility;
  // Repost fields
  is_reposted?: boolean;
  repost_status?: string | null;
  can_repost?: boolean;
}

interface PostCardProps {
  post: Post;
  // For chain reposting - when this PostCard is inside a RepostedPostCard,
  // this is the original post ID that should be used when reposting
  originalPostId?: string;
}

export function PostCard({ post, originalPostId }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isSaved, setIsSaved] = useState(post.is_saved);
  const [isReposted, setIsReposted] = useState(post.is_reposted || false);
  const [repostStatus, setRepostStatus] = useState(post.repost_status || null);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [isReposting, setIsReposting] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Local state for editable fields
  const [localHeadline, setLocalHeadline] = useState(post.headline);
  const [localHeadlineStyle, setLocalHeadlineStyle] = useState(post.headline_style);
  const [localTextContent, setLocalTextContent] = useState(post.text_content);
  const [localVisibility, setLocalVisibility] = useState<Visibility>(post.visibility || 'public');

  const isOwnPost = user?.id === post.user_id;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleRepost = async () => {
    if (!user || isReposting) return;

    // Use originalPostId for chain reposting (when viewing a repost),
    // otherwise use the current post's ID
    const targetPostId = originalPostId || post.id;

    // If already reposted, remove the repost
    if (isReposted) {
      setIsReposted(false);
      setRepostStatus(null);
      setRepostsCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(`/api/posts/${targetPostId}/repost`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      } catch {
        // Revert on error
        setIsReposted(true);
        setRepostStatus('approved');
        setRepostsCount((prev) => prev + 1);
      }
      return;
    }

    // Create new repost
    setIsReposting(true);
    try {
      const res = await fetch(`/api/posts/${targetPostId}/repost`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to repost');
        return;
      }

      const data = await res.json();
      setIsReposted(true);
      setRepostStatus(data.repost.status);

      if (data.repost.status === 'approved') {
        setRepostsCount((prev) => prev + 1);
      }

      if (data.repost.status === 'pending') {
        alert('Repost request sent! Waiting for approval.');
      }
    } catch {
      alert('Failed to repost');
    } finally {
      setIsReposting(false);
    }
  };

  const canRepost = post.can_repost !== false && user?.id !== post.user_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article id={`post-${post.id}`} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-shadow">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link href={`/u/${post.author.username}`} className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                post.author.display_name?.[0]?.toUpperCase() ||
                post.author.username[0].toUpperCase()
              )}
            </div>
            {post.author.tier === 'pro' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Crown size={10} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white hover:underline">
                {post.author.display_name || post.author.username}
              </p>
              {post.is_following && (
                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                  Following
                </span>
              )}
              {post.is_sponsored_content && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium border border-amber-500/30">
                  Paid partnership
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">@{post.author.username} · {timeAgo}</p>
          </div>
        </Link>
        <div className="relative">
          <button
            ref={menuButtonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-800 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Post options"
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={20} className="text-gray-500" aria-hidden="true" />
          </button>
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20"
              role="menu"
              aria-label="Post actions"
            >
              {isOwnPost && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 transition"
                    role="menuitem"
                  >
                    <Pencil size={16} className="text-blue-400" aria-hidden="true" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowBoostModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 transition"
                    role="menuitem"
                  >
                    <Rocket size={16} className="text-emerald-400" aria-hidden="true" />
                    Boost Post
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition border-t border-gray-700"
                    role="menuitem"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete Post
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleShare();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 transition"
                role="menuitem"
              >
                <Share2 size={16} className="text-gray-400" aria-hidden="true" />
                Share
              </button>
              {!isOwnPost && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition border-t border-gray-700"
                  role="menuitem"
                >
                  <Flag size={16} aria-hidden="true" />
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content - Only show if no headline overlay on media */}
      {localTextContent && !(localHeadline && post.media_url) && (
        <div className="px-4 pb-3">
          <p className="text-white whitespace-pre-wrap">{renderRichText(localTextContent)}</p>
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="relative">
          {post.content_type === 'image' && (
            <img
              src={post.media_url}
              alt=""
              className="w-full max-h-[95vh] object-contain"
            />
          )}

          {post.content_type === 'video' && (
            <video
              src={post.media_url}
              poster={post.media_thumbnail_url || undefined}
              controls
              className="w-full max-h-[95vh] object-contain"
            />
          )}

          {post.content_type === 'panorama360' && (
            <div className="relative aspect-video">
              <PanoramaViewer
                src={post.media_url}
                autoRotate
                className="w-full h-full"
              />
              <Link
                href={`/panorama/${post.id}`}
                className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm hover:bg-black/70 transition z-10"
              >
                View immersive
              </Link>
            </div>
          )}

          {post.content_type === 'audio' && (
            <div className="p-4">
              <AudioPlayer
                track={{
                  postId: post.id,
                  url: post.media_url || '',
                  title: localHeadline || undefined,
                  author: post.author.display_name || post.author.username,
                  authorAvatar: post.author.avatar_url || undefined,
                  duration: post.media_duration_seconds || 0,
                  waveformUrl: post.media_waveform_url || undefined,
                }}
                showWaveform={!!post.media_waveform_url}
              />
            {/* Headline and description below audio player */}
              {(localHeadline || localTextContent) && (
                <div className="mt-3 space-y-1">
                  {localHeadline && (
                    <h3 className="font-semibold text-white">{localHeadline}</h3>
                  )}
                  {localTextContent && (
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{renderRichText(localTextContent)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Headline Overlay - not for audio posts */}
          {localHeadline && post.content_type !== 'audio' && (
            <HeadlineOverlay
              headline={localHeadline}
              description={localTextContent}
              style={localHeadlineStyle}
              isFlagged={post.is_flagged}
            />
          )}
        </div>
      )}

      {/* Video processing placeholder - shown when video doesn't have media_url yet */}
      {post.content_type === 'video' && !post.media_url && (
        <div className="aspect-video bg-gray-800 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
          <p className="text-white font-medium">Processing video...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a few minutes</p>
        </div>
      )}

      {/* Audio processing placeholder - shown when audio doesn't have media_url yet */}
      {post.content_type === 'audio' && !post.media_url && (
        <div className="p-6 bg-gray-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-xl flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          <p className="text-white font-medium">Processing audio...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
        </div>
      )}

      {/* Provenance label */}
      {post.provenance !== 'original' && (
        <div className="px-4 py-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              post.provenance === 'ai_generated' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
              post.provenance === 'ai_assisted' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
              post.provenance === 'composite' && 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            )}
          >
            <Sparkles size={12} />
            {post.provenance === 'ai_generated' && 'AI Generated'}
            {post.provenance === 'ai_assisted' && 'AI Assisted'}
            {post.provenance === 'composite' && 'Composite/Edited'}
          </span>
        </div>
      )}

      {/* Interaction bar */}
      <footer className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 group min-w-[44px] min-h-[44px] justify-center touch-manipulation active:scale-95 transition-transform"
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
            aria-pressed={isLiked}
          >
            <Heart
              size={22}
              className={clsx(
                'transition',
                isLiked
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-500 group-hover:text-red-500'
              )}
              aria-hidden="true"
            />
            {likesCount > 0 && (
              <span className={clsx('text-sm', isLiked ? 'text-red-500' : 'text-gray-500')}>
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 group min-w-[44px] min-h-[44px] justify-center touch-manipulation active:scale-95 transition-transform"
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
            aria-pressed={isSaved}
          >
            <Bookmark
              size={22}
              className={clsx(
                'transition',
                isSaved
                  ? 'fill-emerald-500 text-emerald-500'
                  : 'text-gray-500 group-hover:text-emerald-500'
              )}
              aria-hidden="true"
            />
          </button>

          {canRepost && (
            <button
              onClick={handleRepost}
              disabled={isReposting}
              className="flex items-center gap-2 group min-w-[44px] min-h-[44px] justify-center touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
              aria-label={isReposted ? 'Remove repost' : 'Repost'}
              aria-pressed={isReposted}
            >
              <Repeat
                size={22}
                className={clsx(
                  'transition',
                  isReposted
                    ? 'text-emerald-500'
                    : 'text-gray-500 group-hover:text-emerald-500',
                  repostStatus === 'pending' && 'text-yellow-500'
                )}
                aria-hidden="true"
              />
              {repostsCount > 0 && (
                <span className={clsx('text-sm', isReposted ? 'text-emerald-500' : 'text-gray-500')}>
                  {repostsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-2 group min-w-[44px] min-h-[44px] justify-center touch-manipulation active:scale-95 transition-transform"
            aria-label="Share post"
          >
            <Share2 size={22} className="text-gray-500 group-hover:text-blue-500 transition" aria-hidden="true" />
          </button>
        </div>

        {post.views_count > 0 && (
          <span className="text-sm text-gray-500" aria-label={`${post.views_count} views`}>
            {post.views_count.toLocaleString()} views
          </span>
        )}
      </footer>

      {/* Boost Modal */}
      {showBoostModal && (
        <BoostPostModal
          postId={post.id}
          onClose={() => setShowBoostModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          postId={post.id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditPostModal
          post={{
            id: post.id,
            content_type: post.content_type,
            headline: localHeadline,
            headline_style: localHeadlineStyle,
            text_content: localTextContent,
            visibility: localVisibility as 'public' | 'followers' | 'private',
          }}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setLocalHeadline(updated.headline);
            setLocalHeadlineStyle(updated.headline_style);
            setLocalTextContent(updated.text_content);
            setLocalVisibility(updated.visibility);
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeletePostModal
          postId={post.id}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </article>
  );
}
