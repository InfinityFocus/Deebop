'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  AlertTriangle,
  Film,
  CheckCircle,
} from 'lucide-react';
import { useVideoEditorStore, VideoClip, TextOverlay } from '@/stores/videoEditorStore';
import VideoEditor from '@/components/video-editor/VideoEditor';

// Project data from database
export interface InitialProject {
  id: string;
  name: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  maxDurationSeconds: number;
  clips: VideoClip[];
  overlays: TextOverlay[];
}

interface VideoEditorClientProps {
  userId: string;
  userTier: string;
  maxDurationSeconds: number;
  initialProject?: InitialProject;
}

export default function VideoEditorClient({
  userId,
  userTier,
  maxDurationSeconds,
  initialProject,
}: VideoEditorClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Get stable action references
  const initProject = useVideoEditorStore((s) => s.initProject);
  const loadProject = useVideoEditorStore((s) => s.loadProject);
  const resetProject = useVideoEditorStore((s) => s.resetProject);
  const setProjectName = useVideoEditorStore((s) => s.setProjectName);

  // Get state values individually to avoid object creation
  const projectId = useVideoEditorStore((s) => s.projectId);
  const projectName = useVideoEditorStore((s) => s.projectName);
  const currentDurationSeconds = useVideoEditorStore((s) => s.currentDurationSeconds);
  const maxDuration = useVideoEditorStore((s) => s.maxDurationSeconds);
  const clips = useVideoEditorStore((s) => s.clips);
  const overlays = useVideoEditorStore((s) => s.overlays);
  const isOverLimit = currentDurationSeconds > maxDurationSeconds;

  // Debug: Log clips state changes
  useEffect(() => {
    console.log('[VideoEditorClient] Clips state updated:', clips.length, 'clips', clips);
  }, [clips]);

  // Initialize project on mount - only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialProject) {
      // Load existing project
      loadProject({
        projectId: initialProject.id,
        name: initialProject.name,
        status: initialProject.status,
        maxDurationSeconds: initialProject.maxDurationSeconds,
        clips: initialProject.clips,
        overlays: initialProject.overlays,
      });
    } else {
      // Initialize new project
      initProject(null, maxDurationSeconds);
    }

    // Cleanup on unmount
    return () => {
      resetProject();
    };
  }, []);

  // Format duration display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save project to database - returns the project ID on success, null on failure
  const handleSave = async (skipNavigation = false): Promise<string | null> => {
    console.log('[VideoEditor] handleSave called, clips:', clips.length, 'skipNav:', skipNavigation);

    if (clips.length === 0) {
      setSaveError('Add at least one video clip before saving');
      return null;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const method = projectId ? 'PUT' : 'POST';
      const url = projectId
        ? `/api/video-projects/${projectId}`
        : '/api/video-projects';

      console.log('[VideoEditor] Saving to:', url, 'method:', method);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          maxDurationSeconds,
          // Don't send client IDs - let server generate them
          clips: clips.map((c) => ({
            sourceUrl: c.sourceUrl,
            sourceDuration: c.sourceDuration,
            sourceWidth: c.sourceWidth,
            sourceHeight: c.sourceHeight,
            sortOrder: c.sortOrder,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
            speed: c.speed,
            filterPreset: c.filterPreset,
            volume: c.volume,
          })),
          overlays: overlays.map((o) => ({
            type: o.type,
            positionX: o.positionX,
            positionY: o.positionY,
            startTime: o.startTime,
            endTime: o.endTime,
            text: o.text,
            fontFamily: o.fontFamily,
            fontSize: o.fontSize,
            fontColor: o.fontColor,
            backgroundColor: o.backgroundColor,
          })),
        }),
      });

      console.log('[VideoEditor] Save response status:', res.status);

      if (!res.ok) {
        const data = await res.json();
        console.error('[VideoEditor] Save error:', data);
        throw new Error(data.error || 'Failed to save project');
      }

      const data = await res.json();
      const savedId = data.id || projectId;
      console.log('[VideoEditor] Saved project ID:', savedId);

      setSaveSuccess('Project saved!');
      setTimeout(() => setSaveSuccess(null), 3000);

      // Update project ID if this was a new project
      if (!projectId && data.id && !skipNavigation) {
        console.log('[VideoEditor] Navigating to:', `/create/video/${data.id}`);
        router.push(`/create/video/${data.id}`);
      }

      return savedId;
    } catch (error) {
      console.error('[VideoEditor] Save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Process video (render final output)
  const handleProcess = async () => {
    console.log('[VideoEditor] handleProcess called, clips:', clips.length, 'isOverLimit:', isOverLimit);

    if (isOverLimit) {
      setSaveError(`Video exceeds ${formatDuration(maxDurationSeconds)} limit for ${userTier} tier`);
      return;
    }

    if (clips.length === 0) {
      setSaveError('Add at least one video clip to process');
      return;
    }

    // First save the project (skip navigation, we'll handle it after processing starts)
    const savedProjectId = await handleSave(true);
    console.log('[VideoEditor] Save before process returned:', savedProjectId);

    if (!savedProjectId) {
      setSaveError('Failed to save project before processing');
      return;
    }

    // Start processing
    try {
      console.log('[VideoEditor] Starting processing for:', savedProjectId);
      const res = await fetch(`/api/video-projects/${savedProjectId}/process`, {
        method: 'POST',
      });

      console.log('[VideoEditor] Process response status:', res.status);

      if (!res.ok) {
        const data = await res.json();
        console.error('[VideoEditor] Process error:', data);
        throw new Error(data.error || 'Failed to start processing');
      }

      // Redirect to project page to see progress
      console.log('[VideoEditor] Navigating to:', `/create/video/${savedProjectId}`);
      router.push(`/create/video/${savedProjectId}`);
    } catch (error) {
      console.error('[VideoEditor] Process failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to process');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] md:min-h-screen bg-zinc-950">
      {/* Header - Mobile responsive */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900 border-b border-zinc-800 gap-2 sm:gap-0">
        {/* Top row: back button, name, and action buttons on mobile */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Film size={18} className="text-emerald-500 flex-shrink-0 hidden sm:block" />
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent text-white font-medium text-base sm:text-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 min-w-0 w-full max-w-[150px] sm:max-w-none"
                placeholder="Project name"
              />
            </div>
          </div>

          {/* Action buttons on mobile (inline with name) */}
          <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
            <button
              onClick={() => {
                console.log('[VideoEditorClient] Save clicked! clips:', clips.length);
                handleSave();
              }}
              disabled={isSaving || clips.length === 0}
              className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
            </button>

            <button
              onClick={() => {
                console.log('[VideoEditorClient] Export clicked! clips:', clips.length, 'isOverLimit:', isOverLimit);
                handleProcess();
              }}
              disabled={isSaving || clips.length === 0 || isOverLimit}
              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Play size={18} />
            </button>
          </div>
        </div>

        {/* Bottom row on mobile: duration and clips count */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          {/* Duration indicator */}
          <div
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm ${
              isOverLimit
                ? 'bg-red-500/20 text-red-400'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {isOverLimit && <AlertTriangle size={12} className="sm:w-[14px] sm:h-[14px]" />}
            <span>{formatDuration(currentDurationSeconds)}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-500">{formatDuration(maxDurationSeconds)}</span>
          </div>

          {/* Debug indicator */}
          <span className="text-xs text-zinc-500">
            [{clips.length} clips]
          </span>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => {
                console.log('[VideoEditorClient] Save clicked! clips:', clips.length);
                handleSave();
              }}
              disabled={isSaving || clips.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save
            </button>

            <button
              onClick={() => {
                console.log('[VideoEditorClient] Export clicked! clips:', clips.length, 'isOverLimit:', isOverLimit);
                handleProcess();
              }}
              disabled={isSaving || clips.length === 0 || isOverLimit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Play size={16} />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Success message */}
      {saveSuccess && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {saveSuccess}
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {saveError}
          <button
            onClick={() => setSaveError(null)}
            className="ml-auto text-red-300 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main editor */}
      <main className="flex-1 overflow-hidden">
        <VideoEditor userTier={userTier} maxDurationSeconds={maxDurationSeconds} />
      </main>
    </div>
  );
}
