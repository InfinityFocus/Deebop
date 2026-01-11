'use client';

import { useRef, useEffect, useState } from 'react';
import { ExternalLink, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { IntroVideoBlockData } from '@/types/creator-page';

interface IntroVideoBlockProps {
  data: IntroVideoBlockData | Record<string, unknown>;
  onClick?: () => void;
}

export function IntroVideoBlock({ data, onClick }: IntroVideoBlockProps) {
  const videoData = data as IntroVideoBlockData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial state based on props
    video.muted = true; // Always start muted (browsers require this for autoplay)

    if (videoData.autoplay) {
      video.play().catch(() => {
        // Autoplay was prevented
      });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoData.autoplay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleCtaClick = () => {
    onClick?.();
  };

  const hasContent = videoData.title || videoData.description || videoData.ctaLabel;

  return (
    <div
      className={`bg-gray-800 rounded-2xl overflow-hidden border ${
        videoData.highlight
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-gray-700'
      }`}
    >
      {/* Video */}
      <div className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoData.videoUrl}
          poster={videoData.posterUrl}
          loop={videoData.loop ?? true}
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
          <button
            onClick={togglePlay}
            className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
        </div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Content (if any) */}
      {hasContent && (
        <div className="p-4">
          {videoData.title && (
            <h3 className="text-lg font-semibold text-white mb-1">
              {videoData.title}
            </h3>
          )}

          {videoData.description && (
            <p className="text-gray-400 text-sm mb-4">{videoData.description}</p>
          )}

          {/* CTA Button */}
          {videoData.ctaLabel && videoData.ctaUrl && (
            <a
              href={videoData.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-xl transition ${
                videoData.highlight
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {videoData.ctaLabel}
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
