'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Image, Video, Globe, Type, Loader2, Upload, Crown, Lock, Newspaper, Clock, Calendar, Eye, EyeOff, AlertCircle, CheckCircle, Music, Mic, FileAudio } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { getTierLimits } from '@/stores/authStore';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { PanoramaViewer } from '@/components/viewers/PanoramaViewer';
import { VisibilitySelector, type Visibility } from './VisibilitySelector';
import { AudiencePickerModal } from './AudiencePickerModal';
import { AudioRecorder } from '@/components/audio';
import type { ContentType, ProvenanceLabel, HeadlineStyle } from '@/types/database';

// Video processing status type
type VideoJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

const contentTypes = [
  { id: 'shout' as ContentType, label: 'Shout', icon: Type, description: 'Short text post' },
  { id: 'image' as ContentType, label: 'Image', icon: Image, description: 'Photo with caption' },
  { id: 'video' as ContentType, label: 'Video', icon: Video, description: 'Short video clip' },
  { id: 'audio' as ContentType, label: 'Audio', icon: Music, description: 'Record or upload audio' },
  { id: 'panorama360' as ContentType, label: '360°', icon: Globe, description: 'Immersive panorama', proOnly: true },
];

const provenanceOptions: { id: ProvenanceLabel; label: string }[] = [
  { id: 'original', label: 'Original content' },
  { id: 'ai_assisted', label: 'AI assisted' },
  { id: 'ai_generated', label: 'AI generated' },
  { id: 'composite', label: 'Composite/edited' },
];

export function CreatePostForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [textContent, setTextContent] = useState('');
  const [headline, setHeadline] = useState('');
  const [headlineStyle, setHeadlineStyle] = useState<HeadlineStyle>('normal');
  const [provenance, setProvenance] = useState<ProvenanceLabel>('original');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Visibility and audience state
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null); // For presigned uploads (panoramas)

  // Multi-image upload state (for image posts with multiple images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [hideTeaser, setHideTeaser] = useState(false);

  // Paid promotion state
  const [isSponsoredContent, setIsSponsoredContent] = useState(false);

  // Sensitive content state
  const [isSensitiveContent, setIsSensitiveContent] = useState(false);

  // Video processing state
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoJobStatus, setVideoJobStatus] = useState<VideoJobStatus | null>(null);
  const [videoJobProgress, setVideoJobProgress] = useState(0);
  const [videoJobError, setVideoJobError] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Audio processing state
  const [audioJobId, setAudioJobId] = useState<string | null>(null);
  const [audioJobStatus, setAudioJobStatus] = useState<VideoJobStatus | null>(null);
  const [audioJobProgress, setAudioJobProgress] = useState(0);
  const [audioJobError, setAudioJobError] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);

  // Poll for video job status
  const pollVideoJobStatus = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/video-jobs/${jobId}`);
      if (!res.ok) return;

      const data = await res.json();
      const job = data.job;

      setVideoJobStatus(job.status);
      setVideoJobProgress(job.progress);

      if (job.status === 'failed') {
        setVideoJobError(job.error_message || 'Video processing failed');
      }

      // Keep polling if not done
      if (job.status === 'pending' || job.status === 'processing') {
        setTimeout(() => pollVideoJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error('Failed to poll video job:', err);
    }
  }, []);

  // Start polling when we have a video job
  useEffect(() => {
    if (videoJobId && (videoJobStatus === 'pending' || videoJobStatus === 'processing')) {
      const timeout = setTimeout(() => pollVideoJobStatus(videoJobId), 2000);
      return () => clearTimeout(timeout);
    }
  }, [videoJobId, videoJobStatus, pollVideoJobStatus]);

  // Poll for audio job status (uses same endpoint as video)
  const pollAudioJobStatus = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/video-jobs/${jobId}`);
      if (!res.ok) return;

      const data = await res.json();
      const job = data.job;

      setAudioJobStatus(job.status);
      setAudioJobProgress(job.progress);

      if (job.status === 'failed') {
        setAudioJobError(job.error_message || 'Audio processing failed');
      }

      // Keep polling if not done
      if (job.status === 'pending' || job.status === 'processing') {
        setTimeout(() => pollAudioJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error('Failed to poll audio job:', err);
    }
  }, []);

  // Start polling when we have an audio job
  useEffect(() => {
    if (audioJobId && (audioJobStatus === 'pending' || audioJobStatus === 'processing')) {
      const timeout = setTimeout(() => pollAudioJobStatus(audioJobId), 2000);
      return () => clearTimeout(timeout);
    }
  }, [audioJobId, audioJobStatus, pollAudioJobStatus]);

  // Upload audio file using presigned URL (bypasses serverless function body limit)
  const uploadAudioFile = async (file: File | Blob): Promise<string> => {
    setIsUploadingAudio(true);
    setAudioJobError(null);

    try {
      // Convert Blob to File if needed
      const audioFile = file instanceof File ? file : new File([file], 'recording.webm', { type: file.type || 'audio/webm' });

      // Step 1: Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: audioFile.name,
          contentType: audioFile.type,
          mediaType: 'audio',
          fileSize: audioFile.size,
        }),
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedRes.json();

      // Step 2: Upload directly to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: audioFile,
        headers: {
          'Content-Type': audioFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Step 3: Finalize upload to create processing job
      const finalizeRes = await fetch('/api/upload/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          mediaType: 'audio',
          fileSize: audioFile.size,
        }),
      });

      if (!finalizeRes.ok) {
        const data = await finalizeRes.json();
        throw new Error(data.error || 'Failed to finalize upload');
      }

      const data = await finalizeRes.json();

      if (data.jobId) {
        setAudioJobId(data.jobId);
        setAudioJobStatus('pending');
        setAudioJobProgress(0);
        // Start polling for status
        pollAudioJobStatus(data.jobId);
        return data.jobId;
      }

      throw new Error('No job ID returned from upload');
    } catch (err) {
      console.error('Audio upload error:', err);
      setAudioJobError(err instanceof Error ? err.message : 'Failed to upload audio');
      throw err;
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Handle audio recording completion
  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    setRecordedAudioBlob(blob);
    setRecordedAudioDuration(duration);
    setShowAudioRecorder(false);

    // Create preview URL
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    // Upload for processing
    try {
      await uploadAudioFile(blob);
    } catch {
      // Error already handled in uploadAudioFile
    }
  };

  if (!user) return null;

  const tierLimits = getTierLimits(user.tier);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // For videos, immediately start upload for async processing
    if (selectedType === 'video' && file.type.startsWith('video/')) {
      try {
        await uploadVideoFile(file);
      } catch {
        // Error already handled in uploadVideoFile
      }
    }

    // For audio, immediately start upload for async processing
    if (selectedType === 'audio' && file.type.startsWith('audio/')) {
      try {
        await uploadAudioFile(file);
      } catch {
        // Error already handled in uploadAudioFile
      }
    }

    // For panoramas, immediately upload via presigned URL
    if (selectedType === 'panorama360' && file.type.startsWith('image/')) {
      try {
        await uploadPanoramaFile(file);
      } catch (err) {
        console.error('Panorama upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload panorama');
      }
    }
  };

  // Handle multiple image file selection
  const handleMultipleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate max 8 images
    if (fileArray.length > 8) {
      setError('Maximum 8 images allowed');
      return;
    }

    // Validate all are images
    const nonImages = fileArray.filter((f) => !f.type.startsWith('image/'));
    if (nonImages.length > 0) {
      setError('All files must be images');
      return;
    }

    setError(null);
    setImageUploadError(null);

    // Single image: use the regular single-image flow
    if (fileArray.length === 1) {
      setSelectedFile(fileArray[0]);
      setPreviewUrl(URL.createObjectURL(fileArray[0]));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadedImageUrls([]);
      return;
    }

    // Multiple images: use the multi-image flow
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedFiles(fileArray);

    // Create preview URLs
    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Start batch upload for 2+ images
    try {
      await uploadMultipleImages(fileArray);
    } catch {
      // Error already handled in uploadMultipleImages
    }
  };

  // Remove an image from multi-image selection
  const removeImageAtIndex = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    const newUploaded = uploadedImageUrls.filter((_, i) => i !== index);

    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    setUploadedImageUrls(newUploaded);

    // If we go from 2+ to 1 image, clear multi-image state
    if (newFiles.length < 2) {
      if (newFiles.length === 1) {
        // Switch to single image mode
        setSelectedFile(newFiles[0]);
        setPreviewUrl(newUrls[0]);
      }
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadedImageUrls([]);
    }
  };

  // Upload panorama using presigned URL (bypasses serverless function body limit)
  const uploadPanoramaFile = async (file: File): Promise<string> => {
    setUploadProgress(10);

    try {
      // Step 1: Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          mediaType: 'panorama360',
          fileSize: file.size,
        }),
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignedRes.json();
      setUploadProgress(30);

      // Step 2: Upload directly to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadProgress(100);
      setUploadedMediaUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Panorama upload error:', err);
      setUploadProgress(0);
      throw err;
    }
  };

  // Upload video using presigned URL (bypasses serverless function body limit)
  const uploadVideoFile = async (file: File): Promise<string> => {
    setIsUploadingVideo(true);
    setVideoJobError(null);

    try {
      // Step 1: Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          mediaType: 'video',
          fileSize: file.size,
        }),
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedRes.json();

      // Step 2: Upload directly to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Step 3: Finalize upload to create processing job
      const finalizeRes = await fetch('/api/upload/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          mediaType: 'video',
          fileSize: file.size,
        }),
      });

      if (!finalizeRes.ok) {
        const data = await finalizeRes.json();
        throw new Error(data.error || 'Failed to finalize upload');
      }

      const data = await finalizeRes.json();

      if (data.jobId) {
        setVideoJobId(data.jobId);
        setVideoJobStatus('pending');
        setVideoJobProgress(0);
        // Start polling for status
        pollVideoJobStatus(data.jobId);
        return data.jobId;
      }

      throw new Error('No job ID returned from upload');
    } catch (err) {
      console.error('Video upload error:', err);
      setVideoJobError(err instanceof Error ? err.message : 'Failed to upload video');
      throw err;
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Upload multiple images using batch presigned URLs
  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    setIsUploadingImages(true);
    setImageUploadError(null);

    try {
      // Step 1: Get batch presigned URLs
      const batchRes = await fetch('/api/upload/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((file) => ({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          })),
          mediaType: 'image',
        }),
      });

      if (!batchRes.ok) {
        const data = await batchRes.json();
        throw new Error(data.error || 'Failed to get upload URLs');
      }

      const { uploads } = await batchRes.json();

      // Step 2: Upload all files in parallel
      const uploadPromises = uploads.map(async (upload: { index: number; uploadUrl: string; publicUrl: string }, i: number) => {
        const file = files[upload.index];
        const uploadRes = await fetch(upload.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload image ${i + 1}`);
        }

        return upload.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImageUrls(urls);
      return urls;
    } catch (err) {
      console.error('Multi-image upload error:', err);
      setImageUploadError(err instanceof Error ? err.message : 'Failed to upload images');
      throw err;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Use presigned URLs for panoramas (large files) to bypass serverless limits
      if (selectedType === 'panorama360') {
        // Step 1: Get presigned URL
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            mediaType: 'panorama360',
            fileSize: file.size,
          }),
        });

        if (!presignedRes.ok) {
          const data = await presignedRes.json();
          throw new Error(data.error || 'Failed to get upload URL');
        }

        const { uploadUrl, publicUrl } = await presignedRes.json();

        // Step 2: Upload directly to storage
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file to storage');
        }

        return publicUrl;
      }

      // For images, use the regular upload endpoint (smaller files)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', selectedType as string);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      const { url } = await res.json();
      return url;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    if (selectedType === 'shout' && !textContent.trim()) return;
    // For images, require either a single file OR multiple uploaded URLs (2-8)
    if (selectedType === 'image' && !selectedFile && uploadedImageUrls.length === 0) return;
    if (selectedType === 'panorama360' && !uploadedMediaUrl) return;
    // For videos, require either a file or a video job ID
    if (selectedType === 'video' && !selectedFile && !videoJobId) return;
    // For audio, require either a file/recording or an audio job ID
    if (selectedType === 'audio' && !selectedFile && !recordedAudioBlob && !audioJobId) return;

    // Validate private posts have audience
    if (visibility === 'private' && selectedUserIds.length === 0 && selectedGroupIds.length === 0) {
      setError('Please select at least one follower or group for private posts');
      return;
    }

    // For videos with pending/processing jobs, don't block posting - the video will appear when ready
    // But show a warning if the job failed
    if (selectedType === 'video' && videoJobStatus === 'failed') {
      setError(videoJobError || 'Video processing failed. Please try uploading again.');
      return;
    }

    // For audio with failed jobs
    if (selectedType === 'audio' && audioJobStatus === 'failed') {
      setError(audioJobError || 'Audio processing failed. Please try uploading again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build FormData for the API
      const formData = new FormData();
      formData.append('content_type', selectedType);
      formData.append('visibility', visibility);
      formData.append('provenance', provenance);

      if (textContent.trim()) {
        formData.append('text_content', textContent.trim());
      }

      // Add headline for non-shout posts
      if (selectedType !== 'shout' && headline.trim()) {
        formData.append('headline', headline.trim());
        formData.append('headline_style', headlineStyle);
      }

      // For videos, use video_job_id instead of media file
      if (selectedType === 'video' && videoJobId) {
        formData.append('video_job_id', videoJobId);
      } else if (selectedType === 'audio' && audioJobId) {
        // For audio, use audio_job_id
        formData.append('audio_job_id', audioJobId);
      } else if (selectedType === 'panorama360' && uploadedMediaUrl) {
        // For panoramas, send the pre-uploaded URL
        formData.append('media_url', uploadedMediaUrl);
      } else if (selectedType === 'image' && uploadedImageUrls.length >= 2) {
        // For multi-image posts, send the uploaded URLs
        formData.append('media_urls', JSON.stringify(uploadedImageUrls));
      } else if (selectedFile) {
        formData.append('media', selectedFile);
      }

      // Add audience for private posts
      if (visibility === 'private') {
        if (selectedUserIds.length > 0) {
          formData.append('audience_user_ids', JSON.stringify(selectedUserIds));
        }
        if (selectedGroupIds.length > 0) {
          formData.append('audience_group_ids', JSON.stringify(selectedGroupIds));
        }
      }

      // Add scheduling data
      if (isScheduled && scheduledFor) {
        formData.append('scheduled_for', scheduledFor);
        formData.append('hide_teaser', hideTeaser.toString());
      }

      // Add paid promotion declaration
      formData.append('is_sponsored_content', isSponsoredContent.toString());

      // Add sensitive content declaration
      formData.append('is_sensitive_content', isSensitiveContent.toString());

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      router.push('/home');
      router.refresh();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if we can submit the post
  const canSubmit = (() => {
    if (!selectedType || isSubmitting) return false;
    if (selectedType === 'shout') return !!textContent.trim();
    if (selectedType === 'video') {
      // For videos, need either a file being processed or already uploaded
      if (!selectedFile) return false;
      // Block if still uploading
      if (isUploadingVideo) return false;
      // Block if job failed
      if (videoJobStatus === 'failed') return false;
      // Allow posting if we have a job ID (even if still processing)
      return !!videoJobId;
    }
    if (selectedType === 'audio') {
      // For audio, need either a file or recording being processed
      if (!selectedFile && !recordedAudioBlob) return false;
      // Block if still uploading
      if (isUploadingAudio) return false;
      // Block if job failed
      if (audioJobStatus === 'failed') return false;
      // Allow posting if we have a job ID (even if still processing)
      return !!audioJobId;
    }
    if (selectedType === 'panorama360') {
      // For panoramas, need uploaded URL (immediate presigned upload)
      return !!uploadedMediaUrl;
    }
    if (selectedType === 'image') {
      // Block if currently uploading multiple images
      if (isUploadingImages) return false;
      // For multi-image: need uploaded URLs (2-8)
      if (uploadedImageUrls.length >= 2) return true;
      // For single image: just need the file
      return !!selectedFile;
    }
    return false;
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/home" className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition">
          <X size={24} />
        </Link>
        <h1 className="text-lg font-semibold">Create Post</h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || (isScheduled && !scheduledFor)}
          className={clsx(
            "px-4 py-1.5 font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed",
            isScheduled && scheduledFor
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-white text-black hover:bg-gray-200"
          )}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isScheduled && scheduledFor ? (
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              Schedule
            </span>
          ) : (
            'Post'
          )}
        </button>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Content Type Selection */}
        {!selectedType ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">What do you want to share?</h2>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isProLocked = type.proOnly && !tierLimits.canUploadPanorama;

                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (isProLocked) {
                        setShowUpgradePrompt(true);
                      } else {
                        setSelectedType(type.id);
                      }
                    }}
                    className={clsx(
                      'p-4 rounded-xl border text-left transition relative',
                      isProLocked
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-emerald-500 hover:bg-gray-800'
                    )}
                  >
                    <Icon size={24} className="mb-2 text-emerald-400" />
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                    {isProLocked && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 text-xs rounded-full">
                        <Crown size={10} />
                        Pro only
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedType(null);
                setSelectedFile(null);
                setPreviewUrl(null);
                setUploadedMediaUrl(null);
                setUploadProgress(0);
                // Reset video processing state
                setVideoJobId(null);
                setVideoJobStatus(null);
                setVideoJobProgress(0);
                setVideoJobError(null);
                // Reset audio processing state
                setAudioJobId(null);
                setAudioJobStatus(null);
                setAudioJobProgress(0);
                setAudioJobError(null);
                setShowAudioRecorder(false);
                setRecordedAudioBlob(null);
                setRecordedAudioDuration(0);
                // Reset multi-image state
                setSelectedFiles([]);
                setPreviewUrls([]);
                setUploadedImageUrls([]);
                setImageUploadError(null);
              }}
              className="text-emerald-400 hover:text-emerald-300 text-sm"
            >
              &larr; Change type
            </button>

            {/* Headline Input (for non-shout posts) */}
            {selectedType !== 'shout' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Headline (optional)
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Add a catchy headline..."
                    maxLength={80}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>No URLs allowed</span>
                    <span>{headline.length}/80</span>
                  </div>
                </div>

                {/* Headline Style Toggle (only show when headline is present) */}
                {headline.trim().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Headline Style
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHeadlineStyle('normal')}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition',
                          headlineStyle === 'normal'
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        )}
                      >
                        <Type size={16} />
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeadlineStyle('news')}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition',
                          headlineStyle === 'news'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                        )}
                      >
                        <Newspaper size={16} />
                        News
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {headlineStyle === 'news'
                        ? 'Serif font with amber tint and NEWS badge'
                        : 'Clean sans-serif on dark overlay'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {selectedType === 'shout' ? 'Your shout' : 'Description'}
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={selectedType === 'shout' ? "What's on your mind?" : 'Add a description...'}
                maxLength={500}
                className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Use #hashtags to categorize</span>
                <span>{textContent.length}/500</span>
              </div>
            </div>

            {/* Media Upload */}
            {selectedType !== 'shout' && (
              <div>
                {/* Multi-image preview grid */}
                {selectedType === 'image' && previewUrls.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImageAtIndex(index)}
                            className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-black transition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {/* Add more images button */}
                      {previewUrls.length < 8 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-emerald-500 transition">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleMultipleImageSelect}
                            className="hidden"
                          />
                          <span className="text-2xl text-gray-500">+</span>
                        </label>
                      )}
                    </div>
                    {/* Upload progress/status */}
                    {isUploadingImages && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading images...
                      </div>
                    )}
                    {uploadedImageUrls.length >= 2 && !isUploadingImages && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        {uploadedImageUrls.length} images ready
                      </div>
                    )}
                    {imageUploadError && (
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {imageUploadError}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{previewUrls.length}/8 images selected</p>
                  </div>
                ) : previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    {selectedType === 'image' && (
                      <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain bg-gray-900" />
                    )}
                    {selectedType === 'video' && (
                      <div className="relative">
                        <video src={previewUrl} controls className="w-full max-h-[400px]" />
                        {/* Video processing overlay */}
                        {(isUploadingVideo || videoJobStatus === 'pending' || videoJobStatus === 'processing') && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                            <p className="text-white font-medium mb-1">
                              {isUploadingVideo ? 'Uploading video...' : 'Processing video...'}
                            </p>
                            {!isUploadingVideo && videoJobProgress > 0 && (
                              <div className="w-48 mt-2">
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${videoJobProgress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-1">{videoJobProgress}%</p>
                              </div>
                            )}
                            <p className="text-sm text-gray-400 mt-2">
                              You can post now - video will appear when ready
                            </p>
                          </div>
                        )}
                        {videoJobStatus === 'completed' && (
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500/90 text-white px-2 py-1 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Video ready
                          </div>
                        )}
                        {videoJobStatus === 'failed' && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                            <p className="text-red-400 font-medium mb-1">Processing failed</p>
                            <p className="text-sm text-gray-400 max-w-xs text-center">{videoJobError}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedType === 'panorama360' && (
                      <div className="aspect-video bg-gray-800 relative">
                        <PanoramaViewer
                          src={previewUrl}
                          autoRotate={false}
                          className="w-full h-full"
                        />
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                          <Globe size={14} className="text-emerald-400" />
                          <span className="text-sm text-gray-300">{selectedFile?.name}</span>
                        </div>
                      </div>
                    )}
                    {selectedType === 'audio' && (
                      <div className="relative bg-gray-900 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Music className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {selectedFile?.name || 'Recorded audio'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {recordedAudioDuration > 0
                                ? `${Math.floor(recordedAudioDuration / 60)}:${(recordedAudioDuration % 60).toString().padStart(2, '0')}`
                                : selectedFile?.type || 'audio/webm'}
                            </p>
                            {previewUrl && (
                              <audio src={previewUrl} controls className="mt-2 w-full h-8" />
                            )}
                          </div>
                        </div>
                        {/* Audio processing overlay */}
                        {(isUploadingAudio || audioJobStatus === 'pending' || audioJobStatus === 'processing') && (
                          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                            <p className="text-white font-medium mb-1">
                              {isUploadingAudio ? 'Uploading audio...' : 'Processing audio...'}
                            </p>
                            {!isUploadingAudio && audioJobProgress > 0 && (
                              <div className="w-48 mt-2">
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${audioJobProgress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-1">{audioJobProgress}%</p>
                              </div>
                            )}
                            <p className="text-sm text-gray-400 mt-2">
                              You can post now - audio will appear when ready
                            </p>
                          </div>
                        )}
                        {audioJobStatus === 'completed' && (
                          <div className="absolute top-2 right-12 flex items-center gap-1.5 bg-emerald-500/90 text-white px-2 py-1 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Audio ready
                          </div>
                        )}
                        {audioJobStatus === 'failed' && (
                          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                            <p className="text-red-400 font-medium mb-1">Processing failed</p>
                            <p className="text-sm text-gray-400 max-w-xs text-center">{audioJobError}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        // Reset video processing state
                        setVideoJobId(null);
                        setVideoJobStatus(null);
                        setVideoJobProgress(0);
                        setVideoJobError(null);
                        // Reset audio processing state
                        setAudioJobId(null);
                        setAudioJobStatus(null);
                        setAudioJobProgress(0);
                        setAudioJobError(null);
                        setRecordedAudioBlob(null);
                        setRecordedAudioDuration(0);
                        // Reset panorama presigned upload state
                        setUploadedMediaUrl(null);
                        setUploadProgress(0);
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : selectedType === 'audio' ? (
                  // Audio-specific upload UI with recording option
                  showAudioRecorder ? (
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                      onCancel={() => setShowAudioRecorder(false)}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-8">
                      <div className="flex flex-col items-center gap-4">
                        {/* Record option */}
                        <button
                          type="button"
                          onClick={() => setShowAudioRecorder(true)}
                          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white rounded-xl font-medium transition w-full max-w-xs justify-center"
                        >
                          <Mic size={24} />
                          Record Audio
                        </button>

                        <div className="flex items-center gap-3 text-gray-500 w-full max-w-xs">
                          <div className="h-px bg-gray-700 flex-1" />
                          <span className="text-sm">or</span>
                          <div className="h-px bg-gray-700 flex-1" />
                        </div>

                        {/* Upload option */}
                        <label className="flex items-center gap-3 px-6 py-4 border border-gray-700 hover:border-emerald-500 text-gray-300 hover:text-white rounded-xl font-medium transition cursor-pointer w-full max-w-xs justify-center">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <FileAudio size={24} />
                          Upload Audio File
                        </label>

                        <p className="text-sm text-gray-500 text-center mt-2">
                          {user.tier === 'free'
                            ? 'Free tier: up to 1 minute, 10MB max'
                            : user.tier === 'standard'
                            ? 'Standard tier: up to 5 minutes, 50MB max'
                            : 'Pro tier: up to 30 minutes, 200MB max'}
                        </p>
                      </div>
                    </div>
                  )
                ) : selectedType === 'image' ? (
                  // Image upload with multi-select support
                  <label className="block border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageSelect}
                      className="hidden"
                    />
                    <Upload size={32} className="mx-auto mb-3 text-gray-500" />
                    <p className="font-semibold mb-1">Click to upload images</p>
                    <p className="text-sm text-gray-500">
                      Select 1-8 images (max {user.tier === 'free' ? '500KB' : user.tier === 'standard' ? '10MB' : '50MB'} each)
                    </p>
                  </label>
                ) : (
                  <label className="block border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 transition">
                    <input
                      type="file"
                      accept={
                        selectedType === 'video'
                          ? 'video/*'
                          : 'image/*'
                      }
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload size={32} className="mx-auto mb-3 text-gray-500" />
                    <p className="font-semibold mb-1">Click to upload {selectedType}</p>
                    <p className="text-sm text-gray-500">
                      {selectedType === 'video' &&
                        `Max ${tierLimits.maxVideoSeconds}s at ${tierLimits.maxVideoResolution}`}
                      {selectedType === 'panorama360' && 'Max 100MB, equirectangular format'}
                    </p>
                  </label>
                )}
              </div>
            )}

            {/* Provenance Label */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Origin
              </label>
              <div className="grid grid-cols-2 gap-2">
                {provenanceOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProvenance(option.id)}
                    className={clsx(
                      'p-3 rounded-lg border text-sm text-left transition',
                      provenance === option.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Who can see this?
              </label>
              <div className="flex items-center gap-3">
                <VisibilitySelector
                  value={visibility}
                  onChange={(newVisibility) => {
                    setVisibility(newVisibility);
                    // Reset audience when changing away from private
                    if (newVisibility !== 'private') {
                      setSelectedUserIds([]);
                      setSelectedGroupIds([]);
                    }
                  }}
                  onPrivateSelect={() => setShowAudiencePicker(true)}
                />

                {/* Show audience summary for private posts */}
                {visibility === 'private' && (selectedUserIds.length > 0 || selectedGroupIds.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setShowAudiencePicker(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:border-zinc-600 transition"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>
                      {selectedUserIds.length > 0 && `${selectedUserIds.length} follower${selectedUserIds.length !== 1 ? 's' : ''}`}
                      {selectedUserIds.length > 0 && selectedGroupIds.length > 0 && ' + '}
                      {selectedGroupIds.length > 0 && `${selectedGroupIds.length} group${selectedGroupIds.length !== 1 ? 's' : ''}`}
                    </span>
                    <span className="text-emerald-400">Edit</span>
                  </button>
                )}

                {/* Prompt to select audience for private posts with no selection */}
                {visibility === 'private' && selectedUserIds.length === 0 && selectedGroupIds.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAudiencePicker(true)}
                    className="text-sm text-amber-400 hover:text-amber-300"
                  >
                    Select audience →
                  </button>
                )}
              </div>
            </div>

            {/* Paid Promotion Declaration */}
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800">
              <input
                type="checkbox"
                id="sponsored-content"
                checked={isSponsoredContent}
                onChange={(e) => setIsSponsoredContent(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <label htmlFor="sponsored-content" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium text-white">Paid promotion</p>
                <p className="text-xs text-gray-500">Check if this post contains sponsored content or paid partnerships</p>
              </label>
            </div>

            {/* Sensitive Content Declaration */}
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800">
              <input
                type="checkbox"
                id="sensitive-content"
                checked={isSensitiveContent}
                onChange={(e) => setIsSensitiveContent(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
              />
              <label htmlFor="sensitive-content" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium text-white">Sensitive content</p>
                <p className="text-xs text-gray-500">Suggestive or adult themes (for example lingerie, alcohol, smoking/vaping, gambling, stunts)</p>
              </label>
            </div>

            {/* Schedule Drop Toggle */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-emerald-400" />
                  <div>
                    <p className="font-medium">Schedule Drop</p>
                    <p className="text-sm text-gray-500">Set a future release time</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduled(!isScheduled);
                    if (!isScheduled) {
                      // Default to 1 hour from now
                      const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
                      setScheduledFor(defaultTime.toISOString().slice(0, 16));
                    }
                  }}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    isScheduled ? 'bg-emerald-500' : 'bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      isScheduled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {isScheduled && (
                <div className="space-y-4 pl-8">
                  {/* Date/Time Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Drop Time
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be at least 5 minutes from now</p>
                  </div>

                  {/* Hide Teaser Toggle */}
                  {selectedType !== 'shout' && (
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3">
                        {hideTeaser ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-emerald-400" />}
                        <div>
                          <p className="text-sm font-medium">Hide teaser preview</p>
                          <p className="text-xs text-gray-500">
                            {hideTeaser
                              ? 'Only title and countdown shown'
                              : 'Blurred preview will be shown'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHideTeaser(!hideTeaser)}
                        className={clsx(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          hideTeaser ? 'bg-amber-500' : 'bg-gray-700'
                        )}
                      >
                        <span
                          className={clsx(
                            'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                            hideTeaser ? 'translate-x-5' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  )}

                  {/* Preview Info */}
                  {scheduledFor && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <Clock size={14} />
                        <span className="text-sm font-medium">Scheduled</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Your followers will see a countdown card until{' '}
                        <span className="text-white font-medium">
                          {new Date(scheduledFor).toLocaleString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="360 Panorama Uploads"
          requiredTier="pro"
          onClose={() => setShowUpgradePrompt(false)}
          variant="modal"
        />
      )}

      {/* Audience Picker Modal */}
      <AudiencePickerModal
        isOpen={showAudiencePicker}
        onClose={() => setShowAudiencePicker(false)}
        selectedUserIds={selectedUserIds}
        selectedGroupIds={selectedGroupIds}
        onSelectionChange={(userIds, groupIds) => {
          setSelectedUserIds(userIds);
          setSelectedGroupIds(groupIds);
        }}
      />
    </div>
  );
}
