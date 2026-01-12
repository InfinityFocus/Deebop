'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Type,
  Palette,
  Timer,
  Scissors,
  Plus,
  Upload,
  Loader2,
} from 'lucide-react';
import { useVideoEditorStore, useClips } from '@/stores/videoEditorStore';
import VideoPreview from './preview/VideoPreview';
import Timeline from './timeline/Timeline';
import TextOverlayTools from './tools/TextOverlayTools';
import FilterTools from './tools/FilterTools';
import SpeedTools from './tools/SpeedTools';

interface VideoEditorProps {
  userTier: string;
  maxDurationSeconds: number;
}

const TOOL_TABS = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'filters', label: 'Filters', icon: Palette },
  { id: 'speed', label: 'Speed', icon: Timer },
] as const;

type ToolTabId = (typeof TOOL_TABS)[number]['id'];

export default function VideoEditor({
  userTier,
  maxDurationSeconds,
}: VideoEditorProps) {
  const [activeTab, setActiveTab] = useState<ToolTabId | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clips = useClips();
  const addClip = useVideoEditorStore((s) => s.addClip);
  const selectedClipId = useVideoEditorStore((s) => s.selectedClipId);

  // Handle file upload using presigned URLs (bypasses Vercel's 4.5MB limit)
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('video/')) {
          setUploadError('Only video files are supported');
          continue;
        }

        try {
          // Step 1: Get presigned URL from our API
          const presignRes = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              mediaType: 'video',
              fileSize: file.size,
            }),
          });

          if (!presignRes.ok) {
            const data = await presignRes.json();
            throw new Error(data.error || 'Failed to get upload URL');
          }

          const { uploadUrl, publicUrl } = await presignRes.json();

          // Step 2: Upload directly to S3/MinIO using presigned URL
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadRes.ok) {
            throw new Error('Upload failed');
          }

          // Step 3: Get video metadata from the uploaded file
          const video = document.createElement('video');
          video.preload = 'metadata';

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error('Failed to load video'));
            video.src = publicUrl;
          });

          // Add clip to store
          addClip({
            sourceUrl: publicUrl,
            sourceDuration: video.duration,
            sourceWidth: video.videoWidth,
            sourceHeight: video.videoHeight,
            trimStart: 0,
            trimEnd: null,
            speed: 1,
            filterPreset: null,
            volume: 1,
          });
        } catch (error) {
          setUploadError(
            error instanceof Error ? error.message : 'Upload failed'
          );
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addClip]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left side - Preview and Timeline */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Video Preview */}
        <div className="flex-1 min-h-0 bg-black">
          {clips.length === 0 ? (
            // Empty state - upload prompt
            <div
              className="h-full flex flex-col items-center justify-center p-8"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Upload size={32} className="text-zinc-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Add your first clip
                </h3>
                <p className="text-zinc-400 mb-6">
                  Drag and drop video files here, or click the button below to
                  browse
                </p>
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Add Video Clips
                    </>
                  )}
                </button>
                {uploadError && (
                  <p className="mt-4 text-red-400 text-sm">{uploadError}</p>
                )}
                <p className="mt-4 text-zinc-500 text-sm">
                  Max duration: {Math.floor(maxDurationSeconds / 60)} min (
                  {userTier} tier)
                </p>
              </div>
            </div>
          ) : (
            <VideoPreview />
          )}
        </div>

        {/* Timeline */}
        {clips.length > 0 && (
          <div className="h-48 border-t border-zinc-800 bg-zinc-900">
            <Timeline
              onAddClip={handleUploadClick}
              isUploading={isUploading}
            />
          </div>
        )}
      </div>

      {/* Right side - Tool panels (desktop) / Bottom sheet (mobile) */}
      {clips.length > 0 && (
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900 flex flex-col">
          {/* Tool tabs */}
          <div className="flex border-b border-zinc-800">
            {TOOL_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(activeTab === tab.id ? null : tab.id)
                  }
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'text-emerald-400 bg-zinc-800/50'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tool panel content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'text' && <TextOverlayTools />}
            {activeTab === 'filters' && <FilterTools />}
            {activeTab === 'speed' && <SpeedTools />}
            {!activeTab && (
              <div className="text-center text-zinc-500 py-8">
                <p className="text-sm">Select a tool to edit your video</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
