'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, Bookmark, Share2, MessageCircle, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import { useViewTracking } from '@/hooks/useVideoVisibility';

interface ReelAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Reel {
  id: string;
  media_url: string;
  media_thumbnail_url: string | null;
  text_content: string | null;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  views_count: number;
  author: ReelAuthor;
  is_liked: boolean;
  is_saved: boolean;
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

// Prevent right-click/long-press to save media
const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  return false;
};

export function ReelCard({ reel, isActive, isMuted, onToggleMute }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(reel.is_liked);
  const [isSaved, setIsSaved] = useState(reel.is_saved);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [showPlayPause, setShowPlayPause] = useState(false);

  const { startTracking, stopTracking } = useViewTracking({
    postId: reel.id,
    minViewDuration: 3,
    enabled: isActive,
  });

  // Handle play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      startTracking();
    } else {
      video.pause();
      video.currentTime = 0;
      stopTracking();
    }
  }, [isActive, startTracking, stopTracking]);

  // Update muted state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Track progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

    setShowPlayPause(true);
    setTimeout(() => setShowPlayPause(false), 500);
  }, []);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${reel.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/posts/${reel.id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${reel.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      handleLike();
    }
  }, [isLiked]);

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always" onContextMenu={preventContextMenu}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.media_url}
        poster={reel.media_thumbnail_url || undefined}
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlayPause}
        onDoubleClick={handleDoubleTap}
        onContextMenu={preventContextMenu}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Play/Pause indicator */}
      {showPlayPause && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center animate-ping">
            {isPlaying ? (
              <Pause size={40} className="text-white" />
            ) : (
              <Play size={40} className="text-white ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Right side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center">
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center transition',
              isLiked ? 'bg-red-500/20' : 'bg-black/30'
            )}
          >
            <Heart
              size={28}
              className={clsx(
                'transition',
                isLiked ? 'fill-red-500 text-red-500' : 'text-white'
              )}
            />
          </div>
          <span className="text-white text-xs mt-1">{likesCount || ''}</span>
        </button>

        {/* Save */}
        <button onClick={handleSave} className="flex flex-col items-center">
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center transition',
              isSaved ? 'bg-purple-500/20' : 'bg-black/30'
            )}
          >
            <Bookmark
              size={28}
              className={clsx(
                'transition',
                isSaved ? 'fill-purple-500 text-purple-500' : 'text-white'
              )}
            />
          </div>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center">
            <Share2 size={28} className="text-white" />
          </div>
        </button>

        {/* Mute/Unmute */}
        <button onClick={onToggleMute} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center">
            {isMuted ? (
              <VolumeX size={28} className="text-white" />
            ) : (
              <Volume2 size={28} className="text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 bottom-6">
        {/* Author */}
        <Link href={`/u/${reel.author.username}`} className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white">
            {reel.author.avatar_url ? (
              <img
                src={reel.author.avatar_url}
                alt={reel.author.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              reel.author.display_name?.[0]?.toUpperCase() ||
              reel.author.username[0].toUpperCase()
            )}
          </div>
          <span className="text-white font-semibold">@{reel.author.username}</span>
        </Link>

        {/* Caption */}
        {reel.text_content && (
          <p className="text-white text-sm line-clamp-2">{reel.text_content}</p>
        )}
      </div>
    </div>
  );
}
