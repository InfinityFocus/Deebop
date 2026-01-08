'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Image, Video, Maximize2, Loader2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAddAlbumItem } from '@/hooks/useAlbum';
import type { ContentType, ProvenanceLabel } from '@/types/database';

interface AlbumUploadPanelProps {
  albumId: string;
  onSuccess?: () => void;
}

interface PendingUpload {
  id: string;
  file: File;
  preview: string;
  contentType: ContentType;
  caption: string;
  provenance: ProvenanceLabel;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const provenanceOptions: { value: ProvenanceLabel; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'ai_generated', label: 'AI Generated' },
  { value: 'ai_assisted', label: 'AI Assisted' },
  { value: 'composite', label: 'Composite' },
];

export function AlbumUploadPanel({ albumId, onSuccess }: AlbumUploadPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addItem = useAddAlbumItem(albumId);

  const getContentType = (file: File): ContentType => {
    if (file.type.startsWith('video/')) return 'video';
    // Check for panorama based on filename or size ratio later
    return 'image';
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newUploads: PendingUpload[] = Array.from(files).map((file) => {
      const contentType = getContentType(file);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        contentType,
        caption: '',
        provenance: 'original' as ProvenanceLabel,
        status: 'pending' as const,
      };
    });

    setUploads((prev) => [...prev, ...newUploads]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.id === id);
      if (upload) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter((u) => u.id !== id);
    });
  };

  const updateUpload = (id: string, updates: Partial<PendingUpload>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  const handleUploadAll = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending');
    if (pendingUploads.length === 0) return;

    setIsUploading(true);

    for (const upload of pendingUploads) {
      updateUpload(upload.id, { status: 'uploading' });

      try {
        // Create FormData for the upload
        const formData = new FormData();
        formData.append('media', upload.file);
        formData.append('content_type', upload.contentType);
        formData.append('provenance', upload.provenance);
        if (upload.caption) {
          formData.append('caption', upload.caption);
        }

        const res = await fetch(`/api/albums/${albumId}/items`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Upload failed');
        }

        updateUpload(upload.id, { status: 'done' });
      } catch (err: any) {
        updateUpload(upload.id, { status: 'error', error: err.message });
      }
    }

    setIsUploading(false);

    // Check if all uploads are done
    const allDone = uploads.every((u) => u.status === 'done' || u.status === 'error');
    if (allDone) {
      // Cleanup and redirect
      uploads.forEach((u) => URL.revokeObjectURL(u.preview));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/albums/${albumId}`);
      }
    }
  };

  const pendingCount = uploads.filter((u) => u.status === 'pending').length;
  const doneCount = uploads.filter((u) => u.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition"
      >
        <Upload size={48} className="mx-auto text-gray-500 mb-4" />
        <p className="text-gray-300 font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-gray-500 text-sm">
          Images, videos, and 360 panoramas
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Pending Uploads */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">
              {uploads.length} file{uploads.length !== 1 ? 's' : ''} selected
              {doneCount > 0 && ` (${doneCount} uploaded)`}
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition',
                  isUploading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload All ({pendingCount})
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={clsx(
                  'flex gap-4 p-4 rounded-lg border',
                  upload.status === 'done'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : upload.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-800/50 border-gray-700'
                )}
              >
                {/* Preview */}
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative">
                  {upload.contentType === 'video' ? (
                    <video
                      src={upload.preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={upload.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-1">
                    {upload.contentType === 'video' ? (
                      <Video size={10} />
                    ) : upload.contentType === 'panorama360' ? (
                      <Maximize2 size={10} />
                    ) : (
                      <Image size={10} />
                    )}
                  </div>

                  {/* Status Overlay */}
                  {upload.status !== 'pending' && (
                    <div
                      className={clsx(
                        'absolute inset-0 flex items-center justify-center',
                        upload.status === 'uploading' && 'bg-black/50',
                        upload.status === 'done' && 'bg-emerald-500/30',
                        upload.status === 'error' && 'bg-red-500/30'
                      )}
                    >
                      {upload.status === 'uploading' && (
                        <Loader2 size={24} className="animate-spin text-white" />
                      )}
                      {upload.status === 'done' && (
                        <Check size={24} className="text-emerald-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {upload.status === 'pending' && (
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="p-1 rounded hover:bg-gray-700 transition"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    )}
                  </div>

                  {upload.status === 'error' && (
                    <p className="text-red-400 text-sm mt-1">{upload.error}</p>
                  )}

                  {upload.status === 'pending' && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {/* Caption */}
                      <input
                        type="text"
                        value={upload.caption}
                        onChange={(e) =>
                          updateUpload(upload.id, { caption: e.target.value })
                        }
                        placeholder="Caption (optional)"
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      {/* Provenance */}
                      <select
                        value={upload.provenance}
                        onChange={(e) =>
                          updateUpload(upload.id, {
                            provenance: e.target.value as ProvenanceLabel,
                          })
                        }
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {provenanceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
