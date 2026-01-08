'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudioPlayerStore, type AudioTrack } from '@/stores/audioPlayerStore';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioPlayerProps {
  track: AudioTrack;
  showWaveform?: boolean;
  compact?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer({
  track,
  showWaveform = true,
  compact = false,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    resume,
    setCurrentTime,
    setDuration,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayerStore();

  const isCurrentTrack = currentTrack?.postId === track.postId;
  const isThisPlaying = isCurrentTrack && isPlaying;

  // Sync audio element with store state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isCurrentTrack) return;

    // Update audio element state based on store
    if (isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }

    // Sync volume
    audio.volume = isMuted ? 0 : volume;
  }, [isCurrentTrack, isPlaying, volume, isMuted]);

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isCurrentTrack) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      pause();
      seek(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isCurrentTrack, setCurrentTime, setDuration, pause, seek]);

  // Seek when store's currentTime changes (e.g., from mini-player)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isCurrentTrack) return;

    // Only sync if there's a significant difference (avoid feedback loop)
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, isCurrentTrack]);

  const handlePlayPause = useCallback(() => {
    if (isThisPlaying) {
      pause();
    } else if (isCurrentTrack) {
      resume();
    } else {
      play(track);
    }
  }, [isThisPlaying, isCurrentTrack, pause, resume, play, track]);

  const handleSeek = useCallback(
    (progress: number) => {
      const newTime = progress * (isCurrentTrack ? duration : track.duration);
      if (isCurrentTrack) {
        seek(newTime);
        if (audioRef.current) {
          audioRef.current.currentTime = newTime;
        }
      } else {
        // Start playing from this position
        play(track);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = newTime;
          }
        }, 100);
      }
    },
    [isCurrentTrack, duration, track, seek, play]
  );

  const progress = isCurrentTrack && duration > 0 ? currentTime / duration : 0;
  const displayTime = isCurrentTrack ? currentTime : 0;
  const displayDuration = isCurrentTrack && duration > 0 ? duration : track.duration;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Only render audio element for current track */}
        {isCurrentTrack && (
          <audio ref={audioRef} src={track.url} preload="metadata" />
        )}

        <button
          onClick={handlePlayPause}
          className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
        >
          {isThisPlaying ? (
            <Pause className="w-4 h-4" fill="currentColor" />
          ) : (
            <Play className="w-4 h-4" fill="currentColor" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <span className="text-xs text-gray-400 tabular-nums">
          {formatTime(displayDuration)}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/80 rounded-xl p-4 ${className}`}>
      {/* Only render audio element for current track */}
      {isCurrentTrack && (
        <audio ref={audioRef} src={track.url} preload="metadata" />
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex-shrink-0"
        >
          {isThisPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5" fill="currentColor" />
          )}
        </button>

        {/* Waveform and progress */}
        <div className="flex-1 min-w-0">
          {showWaveform && track.waveformUrl ? (
            <WaveformVisualizer
              waveformUrl={track.waveformUrl}
              progress={progress}
              onSeek={handleSeek}
              height={40}
            />
          ) : (
            <div
              className="h-10 bg-gray-800 rounded-lg relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const progress = (e.clientX - rect.left) / rect.width;
                handleSeek(progress);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/30 rounded-lg transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-lg transition-all duration-100"
                style={{ left: `calc(${progress * 100}% - 6px)` }}
              />
            </div>
          )}

          {/* Time display */}
          <div className="flex justify-between mt-1 text-xs text-gray-400 tabular-nums">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Volume control */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
