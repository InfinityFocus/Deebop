/**
 * Audio Player Store with Zustand
 * Manages global audio playback state for persistent mini-player
 */

import { create } from 'zustand';

export interface AudioTrack {
  postId: string;
  url: string;
  title: string;
  author: string;
  authorAvatar?: string;
  waveformUrl?: string;
  duration: number;
}

interface AudioPlayerState {
  // Current playback state
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Queue (future feature)
  queue: AudioTrack[];

  // Actions
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  close: () => void;

  // Queue actions (future feature)
  addToQueue: (track: AudioTrack) => void;
  clearQueue: () => void;
  playNext: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  queue: [],

  // Play a new track (replaces current track)
  play: (track) => {
    const { currentTrack } = get();

    // If same track, just resume
    if (currentTrack?.postId === track.postId) {
      set({ isPlaying: true });
      return;
    }

    // Play new track
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration || 0,
    });
  },

  // Pause current track
  pause: () => set({ isPlaying: false }),

  // Resume current track
  resume: () => {
    const { currentTrack } = get();
    if (currentTrack) {
      set({ isPlaying: true });
    }
  },

  // Stop playback and clear track
  stop: () =>
    set({
      isPlaying: false,
      currentTime: 0,
    }),

  // Seek to time
  seek: (time) => {
    const { duration } = get();
    const clampedTime = Math.max(0, Math.min(time, duration));
    set({ currentTime: clampedTime });
  },

  // Set volume (0-1)
  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  },

  // Toggle mute
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // Update current time (called by audio element)
  setCurrentTime: (time) => set({ currentTime: time }),

  // Update duration (called when metadata loads)
  setDuration: (duration) => set({ duration }),

  // Close player (clear track and stop)
  close: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }),

  // Queue management (future feature)
  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
    })),

  clearQueue: () => set({ queue: [] }),

  playNext: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [nextTrack, ...remaining] = queue;
      set({
        currentTrack: nextTrack,
        isPlaying: true,
        currentTime: 0,
        duration: nextTrack.duration || 0,
        queue: remaining,
      });
    } else {
      // No more tracks in queue
      set({
        isPlaying: false,
        currentTime: 0,
      });
    }
  },
}));

// Selectors
export const useCurrentTrack = () => useAudioPlayerStore((state) => state.currentTrack);
export const useIsPlaying = () => useAudioPlayerStore((state) => state.isPlaying);
export const useAudioProgress = () =>
  useAudioPlayerStore((state) => ({
    currentTime: state.currentTime,
    duration: state.duration,
    progress: state.duration > 0 ? state.currentTime / state.duration : 0,
  }));
export const useAudioVolume = () =>
  useAudioPlayerStore((state) => ({
    volume: state.volume,
    isMuted: state.isMuted,
  }));
