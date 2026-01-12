'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, Play, Podcast, MessageCircle, Video } from 'lucide-react';
import type { PostResult } from '@/types/explore';

// Small video component that autoplays when in view
function AutoplayVideo({ src, poster, className }: { src: string; poster?: string | null; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster || undefined}
      muted
      loop
      playsInline
      className={className}
    />
  );
}

interface TrendingPostCardProps {
  post: PostResult;
}

// Check if URL is an image (not a video file)
function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

export default function TrendingPostCard({ post }: TrendingPostCardProps) {
  const isVideo = post.contentType === 'video' || post.contentType === 'reel';
  const isAudio = post.contentType === 'audio';
  const isShout = post.contentType === 'shout';
  // Only use image URLs for the Image component
  const imageUrl = isImageUrl(post.thumbnailUrl) ? post.thumbnailUrl :
                   isImageUrl(post.mediaUrl) ? post.mediaUrl : null;
  const hasValidImage = !!imageUrl;
  const displayName = post.user.displayName || post.user.username;

  return (
    <Link
      href={`/u/${post.user.username}?post=${post.id}`}
      className="flex-shrink-0 w-48 group"
    >
      {/* Media/thumbnail */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
        {isAudio ? (
          // Styled audio card
          <div className="w-full h-full bg-gradient-to-br from-rose-900/80 via-gray-900 to-purple-900/80 flex flex-col items-center justify-center p-4 relative">
            {/* Decorative waveform bars */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  style={{ height: `${20 + Math.sin(i * 0.8) * 30 + Math.random() * 20}%` }}
                />
              ))}
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center mb-3 shadow-lg z-10">
              <Podcast size={24} className="text-white" />
            </div>
            <p className="text-white text-sm font-medium text-center line-clamp-2 z-10">
              {post.headline || post.textContent || 'Audio'}
            </p>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                {displayName[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-gray-400 text-xs">@{post.user.username}</span>
            </div>
            {/* Engagement stats */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-white/80 z-10">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.likeCount}
              </span>
            </div>
          </div>
        ) : isShout ? (
          // Styled shout card
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/80 via-gray-900 to-cyan-900/80 flex flex-col items-center justify-center p-4 relative">
            <MessageCircle size={20} className="text-emerald-400/50 absolute top-3 right-3" />
            <p className="text-white text-sm font-medium text-center line-clamp-5 leading-relaxed">
              &ldquo;{post.textContent || post.headline}&rdquo;
            </p>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                {displayName[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-gray-400 text-xs">@{post.user.username}</span>
            </div>
            {/* Engagement stats */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.likeCount}
              </span>
            </div>
          </div>
        ) : isVideo && post.mediaUrl ? (
          // Autoplaying video card
          <div className="relative w-full h-full">
            <AutoplayVideo
              src={post.mediaUrl}
              poster={post.thumbnailUrl}
              className="w-full h-full object-cover"
            />
            {/* Engagement overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3 text-xs text-white/90">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {post.likeCount}
                </span>
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {post.viewCount >= 1000 ? `${(post.viewCount / 1000).toFixed(1)}k` : post.viewCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : hasValidImage ? (
          <>
            <Image
              src={imageUrl!}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-10 h-10 text-white/90 fill-white/90" />
              </div>
            )}
            {/* Engagement overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3 text-xs text-white/90">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {post.likeCount}
                </span>
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {post.viewCount >= 1000
                      ? `${(post.viewCount / 1000).toFixed(1)}k`
                      : post.viewCount}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <p className="text-sm text-zinc-400 line-clamp-4 text-center">
              {post.textContent}
            </p>
          </div>
        )}
      </div>

      {/* Creator info - only show for posts with image thumbnails */}
      {!isShout && !isAudio && hasValidImage && (
        <div className="mt-2 flex items-center gap-2">
          {post.user.avatar ? (
            <Image
              src={post.user.avatar}
              alt={post.user.username}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium">
              {post.user.username[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm text-zinc-400 truncate">
            @{post.user.username}
          </span>
        </div>
      )}
    </Link>
  );
}
