'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Video,
  Music,
  MessageSquare,
  Upload,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTierGate } from '@/hooks/useTierGate';
import { PageHeader } from '@/components/layout/PageHeader';

type ContentType = 'shout' | 'image' | 'video' | 'audio';

const CONTENT_TYPES: { type: ContentType; label: string; icon: React.ElementType }[] = [
  { type: 'shout', label: 'Shout', icon: MessageSquare },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'audio', label: 'Audio', icon: Music },
];

export default function NewDraftPage() {
  const params = useParams();
  const router = useRouter();
  const { isTeams } = useTierGate();

  const workspaceId = params.id as string;

  const [contentType, setContentType] = useState<ContentType>('shout');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitForReview = false) => {
    e.preventDefault();

    if (contentType === 'shout' && !description.trim()) {
      setError('Description is required for shouts');
      return;
    }

    if (contentType !== 'shout' && !mediaFile) {
      setError(`Please upload ${contentType === 'audio' ? 'an' : 'a'} ${contentType} file`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let mediaUrl = null;

      // Upload media if present
      if (mediaFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', mediaFile);
        formData.append('mediaType', contentType);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Failed to upload file');
        }

        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.url;
        setUploading(false);
      }

      // Create the draft
      const draftRes = await fetch(`/api/workspaces/${workspaceId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          headline: headline.trim() || null,
          description: description.trim() || null,
          mediaUrl,
          submitForReview,
        }),
      });

      if (!draftRes.ok) {
        const data = await draftRes.json();
        throw new Error(data.error || 'Failed to create draft');
      }

      const draftData = await draftRes.json();
      router.push(`/workspace/${workspaceId}/drafts/${draftData.draft.id}`);
    } catch (err) {
      console.error('Save draft error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      setUploading(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isTeams) {
    router.push('/workspace');
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title="New Draft" backHref={`/workspace/${workspaceId}/drafts`} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Draft</h1>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Content Type Selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Content Type</label>
            <div className="grid grid-cols-4 gap-2">
              {CONTENT_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setContentType(type);
                    clearMedia();
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition',
                    contentType === type
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  )}
                >
                  <Icon size={24} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Headline <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Add a headline..."
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Description {contentType === 'shout' && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={contentType === 'shout' ? "What's on your mind?" : 'Add a caption...'}
              maxLength={contentType === 'shout' ? 280 : 2000}
              rows={contentType === 'shout' ? 4 : 3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {description.length} / {contentType === 'shout' ? 280 : 2000}
            </p>
          </div>

          {/* Media Upload */}
          {contentType !== 'shout' && (
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                {contentType === 'image' ? 'Image' : contentType === 'video' ? 'Video' : 'Audio'}{' '}
                <span className="text-red-400">*</span>
              </label>

              {mediaPreview ? (
                <div className="relative">
                  {contentType === 'image' && (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-lg bg-gray-800"
                    />
                  )}
                  {contentType === 'video' && (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-96 rounded-lg bg-gray-800"
                    />
                  )}
                  {contentType === 'audio' && mediaFile && (
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music size={24} className="text-emerald-400" />
                        <span className="text-white truncate">{mediaFile.name}</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black rounded-full transition"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition">
                  <Upload size={32} className="text-gray-500" />
                  <span className="text-gray-400">
                    Click to upload {contentType}
                  </span>
                  <span className="text-xs text-gray-500">
                    {contentType === 'image' && 'JPG, PNG, GIF up to 10MB'}
                    {contentType === 'video' && 'MP4, MOV up to 100MB'}
                    {contentType === 'audio' && 'MP3, WAV up to 50MB'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      contentType === 'image'
                        ? 'image/*'
                        : contentType === 'video'
                        ? 'video/*'
                        : 'audio/*'
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving && !uploading && <Loader2 size={18} className="animate-spin" />}
              {uploading && <Loader2 size={18} className="animate-spin" />}
              {uploading ? 'Uploading...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as any, true)}
              disabled={saving}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              Submit for Review
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Drafts can be edited until submitted for review
          </p>
        </form>
      </div>
    </div>
  );
}
