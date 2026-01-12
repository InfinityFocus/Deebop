/**
 * Video Editor Store with Zustand
 * Manages video editor state for multi-clip editing, filters, overlays, and trim
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// Types matching database schema
export interface VideoClip {
  id: string;
  sourceUrl: string;
  sourceDuration: number;
  sourceWidth?: number;
  sourceHeight?: number;
  sortOrder: number;
  trimStart: number;
  trimEnd: number | null;
  speed: number;
  filterPreset: string | null;
  volume: number;
}

export interface TextOverlay {
  id: string;
  type: 'text' | 'image';
  positionX: number; // percentage 0-100
  positionY: number;
  startTime: number;
  endTime: number | null;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string | null;
}

type VideoProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

interface VideoEditorState {
  // Project metadata
  projectId: string | null;
  projectName: string;
  projectStatus: VideoProjectStatus;
  maxDurationSeconds: number;
  currentDurationSeconds: number;

  // Clips
  clips: VideoClip[];
  selectedClipId: string | null;

  // Overlays
  overlays: TextOverlay[];
  selectedOverlayId: string | null;
  draggingOverlayId: string | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  isMuted: boolean;
  volume: number;

  // UI state
  activeToolPanel: 'clips' | 'text' | 'filters' | 'speed' | 'trim' | null;
  isProcessing: boolean;
  processingProgress: number;

  // Project actions
  initProject: (projectId: string | null, maxDuration: number) => void;
  setProjectName: (name: string) => void;
  loadProject: (data: {
    projectId: string;
    name: string;
    status: VideoProjectStatus;
    maxDurationSeconds: number;
    clips: VideoClip[];
    overlays: TextOverlay[];
  }) => void;
  resetProject: () => void;

  // Clip actions
  addClip: (clip: Omit<VideoClip, 'id' | 'sortOrder'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<VideoClip>) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  selectClip: (clipId: string | null) => void;

  // Overlay actions
  addOverlay: (overlay: Omit<TextOverlay, 'id'>) => void;
  removeOverlay: (overlayId: string) => void;
  updateOverlay: (overlayId: string, updates: Partial<TextOverlay>) => void;
  selectOverlay: (overlayId: string | null) => void;
  setDraggingOverlay: (overlayId: string | null) => void;

  // Playback actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // UI actions
  setActiveToolPanel: (panel: VideoEditorState['activeToolPanel']) => void;
  setProcessing: (isProcessing: boolean, progress?: number) => void;

  // Computed helpers
  getTotalDuration: () => number;
  getClipAtTime: (time: number) => VideoClip | null;
  getActiveOverlays: (time: number) => TextOverlay[];
  isDurationWithinLimit: () => boolean;
}

// Generate a simple unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Calculate effective duration of a clip (considering trim and speed)
const calculateClipDuration = (clip: VideoClip): number => {
  const trimEnd = clip.trimEnd ?? clip.sourceDuration;
  const trimmedDuration = Math.max(0, trimEnd - clip.trimStart);
  return trimmedDuration / clip.speed;
};

// Calculate total project duration from all clips
const calculateTotalDuration = (clips: VideoClip[]): number => {
  return clips.reduce((total, clip) => total + calculateClipDuration(clip), 0);
};

export const useVideoEditorStore = create<VideoEditorState>()((set, get) => ({
  // Initial state
  projectId: null,
  projectName: 'Untitled Project',
  projectStatus: 'draft',
  maxDurationSeconds: 60, // Default to free tier
  currentDurationSeconds: 0,

  clips: [],
  selectedClipId: null,

  overlays: [],
  selectedOverlayId: null,
  draggingOverlayId: null,

  isPlaying: false,
  currentTime: 0,
  isMuted: false,
  volume: 1,

  activeToolPanel: null,
  isProcessing: false,
  processingProgress: 0,

  // Project actions
  initProject: (projectId, maxDuration) => {
    set({
      projectId,
      projectName: 'Untitled Project',
      projectStatus: 'draft',
      maxDurationSeconds: maxDuration,
      currentDurationSeconds: 0,
      clips: [],
      overlays: [],
      selectedClipId: null,
      selectedOverlayId: null,
      currentTime: 0,
      isPlaying: false,
    });
  },

  setProjectName: (name) => set({ projectName: name }),

  loadProject: (data) => {
    const duration = calculateTotalDuration(data.clips);
    set({
      projectId: data.projectId,
      projectName: data.name,
      projectStatus: data.status,
      maxDurationSeconds: data.maxDurationSeconds,
      currentDurationSeconds: duration,
      clips: data.clips,
      overlays: data.overlays,
      selectedClipId: null,
      selectedOverlayId: null,
      currentTime: 0,
      isPlaying: false,
    });
  },

  resetProject: () => {
    set({
      projectId: null,
      projectName: 'Untitled Project',
      projectStatus: 'draft',
      clips: [],
      overlays: [],
      selectedClipId: null,
      selectedOverlayId: null,
      currentTime: 0,
      isPlaying: false,
      isProcessing: false,
      processingProgress: 0,
    });
  },

  // Clip actions
  addClip: (clipData) => {
    const { clips, maxDurationSeconds } = get();
    const newClip: VideoClip = {
      ...clipData,
      id: generateId(),
      sortOrder: clips.length,
    };

    const newClips = [...clips, newClip];
    const duration = calculateTotalDuration(newClips);

    set({
      clips: newClips,
      currentDurationSeconds: duration,
      selectedClipId: newClip.id,
    });
  },

  removeClip: (clipId) => {
    const { clips, selectedClipId } = get();
    const newClips = clips
      .filter((c) => c.id !== clipId)
      .map((c, i) => ({ ...c, sortOrder: i }));

    const duration = calculateTotalDuration(newClips);

    set({
      clips: newClips,
      currentDurationSeconds: duration,
      selectedClipId: selectedClipId === clipId ? null : selectedClipId,
    });
  },

  updateClip: (clipId, updates) => {
    const { clips } = get();
    const newClips = clips.map((c) =>
      c.id === clipId ? { ...c, ...updates } : c
    );
    const duration = calculateTotalDuration(newClips);

    set({
      clips: newClips,
      currentDurationSeconds: duration,
    });
  },

  reorderClips: (fromIndex, toIndex) => {
    const { clips } = get();
    const newClips = [...clips];
    const [movedClip] = newClips.splice(fromIndex, 1);
    newClips.splice(toIndex, 0, movedClip);

    // Update sort orders
    const reorderedClips = newClips.map((c, i) => ({ ...c, sortOrder: i }));

    set({ clips: reorderedClips });
  },

  selectClip: (clipId) => {
    set({ selectedClipId: clipId, selectedOverlayId: null });
  },

  // Overlay actions
  addOverlay: (overlayData) => {
    const { overlays } = get();
    const newOverlay: TextOverlay = {
      ...overlayData,
      id: generateId(),
    };

    set({
      overlays: [...overlays, newOverlay],
      selectedOverlayId: newOverlay.id,
      selectedClipId: null,
    });
  },

  removeOverlay: (overlayId) => {
    const { overlays, selectedOverlayId } = get();
    set({
      overlays: overlays.filter((o) => o.id !== overlayId),
      selectedOverlayId: selectedOverlayId === overlayId ? null : selectedOverlayId,
    });
  },

  updateOverlay: (overlayId, updates) => {
    const { overlays } = get();
    set({
      overlays: overlays.map((o) =>
        o.id === overlayId ? { ...o, ...updates } : o
      ),
    });
  },

  selectOverlay: (overlayId) => {
    set({ selectedOverlayId: overlayId, selectedClipId: null });
  },

  setDraggingOverlay: (overlayId) => {
    set({ draggingOverlayId: overlayId });
  },

  // Playback actions
  play: () => {
    const { currentDurationSeconds, currentTime } = get();
    if (currentDurationSeconds > 0 && currentTime < currentDurationSeconds) {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  togglePlayPause: () => {
    const { isPlaying, currentDurationSeconds, currentTime } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else if (currentDurationSeconds > 0) {
      // If at end, reset to beginning
      const newTime = currentTime >= currentDurationSeconds ? 0 : currentTime;
      set({ isPlaying: true, currentTime: newTime });
    }
  },

  seek: (time) => {
    const { currentDurationSeconds } = get();
    const clampedTime = Math.max(0, Math.min(time, currentDurationSeconds));
    set({ currentTime: clampedTime });
  },

  setCurrentTime: (time) => {
    const { currentDurationSeconds, isPlaying } = get();
    if (time >= currentDurationSeconds && isPlaying) {
      // Reached end of video
      set({ currentTime: currentDurationSeconds, isPlaying: false });
    } else {
      set({ currentTime: time });
    }
  },

  setVolume: (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // UI actions
  setActiveToolPanel: (panel) => set({ activeToolPanel: panel }),

  setProcessing: (isProcessing, progress = 0) => {
    set({
      isProcessing,
      processingProgress: progress,
      projectStatus: isProcessing ? 'processing' : get().projectStatus,
    });
  },

  // Computed helpers
  getTotalDuration: () => {
    const { clips } = get();
    return calculateTotalDuration(clips);
  },

  getClipAtTime: (time) => {
    const { clips } = get();
    let accumulatedTime = 0;

    for (const clip of clips.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const clipDuration = calculateClipDuration(clip);
      if (time >= accumulatedTime && time < accumulatedTime + clipDuration) {
        return clip;
      }
      accumulatedTime += clipDuration;
    }

    return null;
  },

  getActiveOverlays: (time) => {
    const { overlays, currentDurationSeconds } = get();
    return overlays.filter((overlay) => {
      const endTime = overlay.endTime ?? currentDurationSeconds;
      return time >= overlay.startTime && time <= endTime;
    });
  },

  isDurationWithinLimit: () => {
    const { currentDurationSeconds, maxDurationSeconds } = get();
    return currentDurationSeconds <= maxDurationSeconds;
  },
}));

// Selectors for common use cases - using useShallow for object returns to prevent infinite loops
export const useProjectInfo = () =>
  useVideoEditorStore(
    useShallow((state) => ({
      projectId: state.projectId,
      projectName: state.projectName,
      projectStatus: state.projectStatus,
      currentDurationSeconds: state.currentDurationSeconds,
      maxDurationSeconds: state.maxDurationSeconds,
    }))
  );

export const useClips = () => useVideoEditorStore((state) => state.clips);
export const useSelectedClip = () =>
  useVideoEditorStore((state) =>
    state.clips.find((c) => c.id === state.selectedClipId) ?? null
  );

export const useOverlays = () => useVideoEditorStore((state) => state.overlays);
export const useSelectedOverlay = () =>
  useVideoEditorStore((state) =>
    state.overlays.find((o) => o.id === state.selectedOverlayId) ?? null
  );

// usePlaybackState uses useShallow to prevent re-renders when object reference changes
// but values are the same
export const usePlaybackState = () =>
  useVideoEditorStore(
    useShallow((state) => ({
      isPlaying: state.isPlaying,
      currentTime: state.currentTime,
      duration: state.currentDurationSeconds,
      volume: state.volume,
      isMuted: state.isMuted,
    }))
  );

export const useIsOverLimit = () =>
  useVideoEditorStore(
    (state) => state.currentDurationSeconds > state.maxDurationSeconds
  );
