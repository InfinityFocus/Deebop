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
} from 'lucide-react';
import { useVideoEditorStore } from '@/stores/videoEditorStore';
import VideoEditor from '@/components/video-editor/VideoEditor';

interface VideoEditorClientProps {
  userId: string;
  userTier: string;
  maxDurationSeconds: number;
}

export default function VideoEditorClient({
  userId,
  userTier,
  maxDurationSeconds,
}: VideoEditorClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Get stable action references
  const initProject = useVideoEditorStore((s) => s.initProject);
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

  // Initialize new project on mount - only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initProject(null, maxDurationSeconds);

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

  // Save project to database
  const handleSave = async () => {
    if (clips.length === 0) {
      setSaveError('Add at least one video clip before saving');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const method = projectId ? 'PUT' : 'POST';
      const url = projectId
        ? `/api/video-projects/${projectId}`
        : '/api/video-projects';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          maxDurationSeconds,
          clips: clips.map((c) => ({
            id: c.id.startsWith('new-') ? undefined : c.id,
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
            id: o.id.startsWith('new-') ? undefined : o.id,
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save project');
      }

      const data = await res.json();

      // Update project ID if this was a new project
      if (!projectId && data.id) {
        // Navigate to the project edit page
        router.push(`/create/video/${data.id}`);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Process video (render final output)
  const handleProcess = async () => {
    if (isOverLimit) {
      setSaveError(`Video exceeds ${formatDuration(maxDurationSeconds)} limit for ${userTier} tier`);
      return;
    }

    if (clips.length === 0) {
      setSaveError('Add at least one video clip to process');
      return;
    }

    // First save the project
    await handleSave();

    if (!projectId) {
      setSaveError('Save the project first before processing');
      return;
    }

    // Start processing
    try {
      const res = await fetch(`/api/video-projects/${projectId}/process`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start processing');
      }

      // Redirect to project page to see progress
      router.push(`/create/video/${projectId}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to process');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] md:min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            <Film size={20} className="text-emerald-500" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-white font-medium text-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1"
              placeholder="Project name"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Duration indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isOverLimit
                ? 'bg-red-500/20 text-red-400'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {isOverLimit && <AlertTriangle size={14} />}
            <span>{formatDuration(currentDurationSeconds)}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-500">{formatDuration(maxDurationSeconds)}</span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
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

          {/* Process/Export button */}
          <button
            onClick={handleProcess}
            disabled={isSaving || clips.length === 0 || isOverLimit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Play size={16} />
            Export
          </button>
        </div>
      </header>

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
