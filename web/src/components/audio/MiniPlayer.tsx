'use client';

import { useRef, useEffect } from 'react';
import { Play, Pause, X, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useAudioPlayerStore } from '@/stores/audioPlayerStore';
import Image from 'next/image';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    pause,
    resume,
    setCurrentTime,
    setDuration,
    seek,
    toggleMute,
    close,
    playNext,
  } = useAudioPlayerStore();

  // Sync audio element with store state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Update audio source if changed
    if (audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
    }

    // Play/pause based on store state
    if (isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }

    // Sync volume
    audio.volume = isMuted ? 0 : volume;
  }, [currentTrack, isPlaying, volume, isMuted]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      // Start playing if isPlaying is true
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      playNext();
    };

    // If metadata is already loaded (readyState >= 1), set duration immediately
    // This handles the race condition where loadedmetadata fires before listener is attached
    if (audio.readyState >= 1 && audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, isPlaying, playNext]);

  // Seek when store's currentTime changes externally
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Only sync if there's a significant difference (avoid feedback loop)
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, currentTrack]);

  // Don't render if no track
  if (!currentTrack) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    seek(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Mini Player Bar - positioned above mobile nav (h-16 = 64px) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 shadow-2xl">
        {/* Progress bar (clickable) */}
        <div
          className="h-1 bg-gray-800 cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-emerald-500 transition-all duration-100 relative"
            style={{ width: `${progress * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 max-w-screen-xl mx-auto">
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pause : resume}
            className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4" fill="currentColor" />
            )}
          </button>

          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentTrack.authorAvatar && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                <Image
                  src={currentTrack.authorAvatar}
                  alt={currentTrack.author}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {currentTrack.title || 'Untitled'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentTrack.author}
              </p>
            </div>
          </div>

          {/* Time display */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Volume (desktop only) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={close}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind mini player */}
      {/* On mobile: nav (h-16) + player (~h-14) = h-30, but nav already has pb-20 in layout */}
      {/* On desktop: just the player height */}
      <div className="h-14 md:h-14" />
    </>
  );
}

export default MiniPlayer;
