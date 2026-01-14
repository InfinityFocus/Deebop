'use client';

import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Repeat, Crown, ExternalLink } from 'lucide-react';
import type { EmbedPost } from '@/types/embed';

interface EmbedPostCardProps {
  post: EmbedPost;
  accentColor?: string;
  showEngagement?: boolean;
  baseUrl: string;
}

// Simplified video player for embeds
function EmbedVideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        className="w-full max-h-[400px] object-contain bg-black"
        onClick={toggleMute}
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full hover:bg-black/80 transition"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Simplified audio player for embeds
function EmbedAudioPlayer({ src, title, duration }: { src: string; title: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-[var(--embed-bg)] border border-[var(--embed-border)] rounded-lg">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setProgress((audio.currentTime / audio.duration) * 100 || 0);
        }}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center transition"
          style={{ backgroundColor: 'var(--embed-accent)' }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--embed-fg)] truncate">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-[var(--embed-border)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: 'var(--embed-accent)' }}
              />
            </div>
            {duration && (
              <span className="text-xs text-[var(--embed-muted)]">{formatTime(duration)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified image carousel for embeds
function EmbedImageCarousel({ images }: { images: Array<{ id: string; media_url: string; sort_order: number }> }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="relative">
      <img
        src={sortedImages[currentIndex].media_url}
        alt=""
        className="w-full max-h-[400px] object-contain bg-black"
      />
      {sortedImages.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {currentIndex < sortedImages.length - 1 && (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sortedImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function EmbedPostCard({ post, showEngagement = true, baseUrl }: EmbedPostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const postUrl = `${baseUrl}/p/${post.id}`;
  const profileUrl = `${baseUrl}/u/${post.author.username}`;

  return (
    <article className="bg-[var(--embed-bg)] border border-[var(--embed-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3 gap-2">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition"
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, var(--embed-accent), #06b6d4)' }}
            >
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
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-[var(--embed-fg)] truncate">
                {post.author.display_name || post.author.username}
              </p>
            </div>
            <p className="text-xs text-[var(--embed-muted)] truncate">
              @{post.author.username} · {timeAgo}
            </p>
          </div>
        </a>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-[var(--embed-border)] rounded-lg transition flex-shrink-0"
          aria-label="View on Deebop"
        >
          <ExternalLink size={16} className="text-[var(--embed-muted)]" />
        </a>
      </header>

      {/* Text content - show if no media with headline overlay */}
      {post.text_content && !(post.headline && post.media_url) && (
        <div className="px-3 pb-2">
          <p className="text-sm text-[var(--embed-fg)] whitespace-pre-wrap line-clamp-4">
            {post.text_content}
          </p>
        </div>
      )}

      {/* Media */}
      {(post.media_url || (post.media && post.media.length > 0)) && (
        <div className="relative">
          {post.content_type === 'image' && post.media && post.media.length > 1 ? (
            <EmbedImageCarousel images={post.media} />
          ) : post.content_type === 'image' && post.media_url && (
            <img
              src={post.media_url}
              alt=""
              className="w-full max-h-[400px] object-contain bg-black"
            />
          )}

          {post.content_type === 'video' && post.media_url && (
            <EmbedVideoPlayer
              src={post.media_url}
              poster={post.media_thumbnail_url || undefined}
            />
          )}

          {post.content_type === 'panorama360' && post.media_url && (
            <div className="relative aspect-video bg-gray-900">
              <img
                src={post.media_thumbnail_url || post.media_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <a
                href={`${baseUrl}/panorama/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
              >
                <div className="text-center text-white">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">View 360°</p>
                </div>
              </a>
            </div>
          )}

          {post.content_type === 'audio' && post.media_url && (
            <div className="p-3">
              <EmbedAudioPlayer
                src={post.media_url}
                title={post.headline || 'Audio'}
                duration={post.media_duration_seconds || undefined}
              />
            </div>
          )}

          {/* Headline overlay - not for audio posts */}
          {post.headline && post.content_type !== 'audio' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
              <h3
                className={`font-bold text-white ${
                  post.headline_style === 'news' ? 'text-lg leading-tight' : 'text-base'
                }`}
              >
                {post.headline}
              </h3>
              {post.text_content && (
                <p className="text-sm text-white/80 mt-1 line-clamp-2">{post.text_content}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Engagement stats */}
      {showEngagement && (post.likes_count > 0 || post.reposts_count > 0) && (
        <footer className="flex items-center gap-4 px-3 py-2 border-t border-[var(--embed-border)]">
          {post.likes_count > 0 && (
            <div className="flex items-center gap-1.5 text-[var(--embed-muted)]">
              <Heart size={14} />
              <span className="text-xs">{post.likes_count.toLocaleString()}</span>
            </div>
          )}
          {post.reposts_count > 0 && (
            <div className="flex items-center gap-1.5 text-[var(--embed-muted)]">
              <Repeat size={14} />
              <span className="text-xs">{post.reposts_count.toLocaleString()}</span>
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
