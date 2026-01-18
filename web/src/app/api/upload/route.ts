import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateFileKey, uploadToMinio } from '@/lib/minio';
import prisma from '@/lib/db';
import sharp from 'sharp';

import { triggerVideoProcessing } from '@/lib/video-job-processor';
import {
  isBunnyStreamEnabled,
  createBunnyVideo,
  uploadToBunnyStream,
  getBunnyPlaybackUrl,
  getBunnyThumbnailUrl,
} from '@/lib/bunny-stream';

// Max upload size before processing (50MB for all image uploads)
const MAX_IMAGE_UPLOAD_SIZE = 50 * 1024 * 1024;
const IMAGE_MAX_WIDTH = 750;
const IMAGE_QUALITY = 85;

// Tier-based file size limits for non-image media
const FILE_LIMITS = {
  free: {
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
    panorama360: 0, // Not allowed
  },
  creator: {
    video: 200 * 1024 * 1024, // 200MB
    audio: 50 * 1024 * 1024, // 50MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
  pro: {
    video: 500 * 1024 * 1024, // 500MB
    audio: 200 * 1024 * 1024, // 200MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
  teams: {
    video: 500 * 1024 * 1024, // 500MB
    audio: 200 * 1024 * 1024, // 200MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
};

// POST /api/upload - Upload file to MinIO (server-side)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mediaType = formData.get('mediaType') as string | null;

    if (!file || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, mediaType' },
        { status: 400 }
      );
    }

    // Check if content type is allowed
    if (!['image', 'video', 'audio', 'panorama360'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Check panorama permission (creator, pro, and teams can upload panoramas)
    if (mediaType === 'panorama360' && !['creator', 'pro', 'teams'].includes(user.tier)) {
      return NextResponse.json(
        { error: '360 panoramas require Creator tier or above' },
        { status: 403 }
      );
    }

    // Check file size limit
    if (mediaType === 'image') {
      // Images have a universal upload limit (will be resized/compressed)
      if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
        return NextResponse.json(
          { error: 'Image file too large. Max upload size: 50MB' },
          { status: 400 }
        );
      }
    } else {
      // Other media types have tier-based limits
      const limits = FILE_LIMITS[user.tier as keyof typeof FILE_LIMITS];
      const maxSize = limits[mediaType as keyof typeof limits];

      if (maxSize === 0) {
        return NextResponse.json(
          { error: `${mediaType} uploads are not available for your tier` },
          { status: 403 }
        );
      }

      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / 1024 / 1024);
        return NextResponse.json(
          { error: `File too large. Max size for ${mediaType}: ${maxMB}MB` },
          { status: 400 }
        );
      }
    }

    // Generate file key and upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());

    // For videos, use Bunny Stream if configured, otherwise fall back to local processing
    if (mediaType === 'video') {
      if (isBunnyStreamEnabled()) {
        // Use Bunny Stream for video hosting
        console.log(`[Upload] Using Bunny Stream for video upload`);

        try {
          // Create video in Bunny Stream
          const videoTitle = `${user.username}_${Date.now()}_${file.name}`;
          const { guid } = await createBunnyVideo(videoTitle);

          console.log(`[Upload] Created Bunny video with GUID: ${guid}`);

          // Upload the video file to Bunny Stream
          await uploadToBunnyStream(guid, buffer);

          console.log(`[Upload] Uploaded video to Bunny Stream: ${guid}`);

          // Create a VideoJob record to track the video (Bunny handles transcoding)
          const videoJob = await prisma.videoJob.create({
            data: {
              userId: user.id,
              userTier: user.tier,
              rawFileUrl: `bunny:${guid}`, // Store Bunny GUID as reference
              rawFileSize: file.size,
              mediaType: 'video',
              status: 'processing', // Bunny is processing
              progress: 0,
              // Store Bunny URLs for when processing completes
              outputUrl: getBunnyPlaybackUrl(guid),
              thumbnailUrl: getBunnyThumbnailUrl(guid),
            },
          });

          return NextResponse.json({
            jobId: videoJob.id,
            bunnyGuid: guid,
            status: 'processing',
            message: 'Video uploaded to Bunny Stream. Transcoding in progress.',
            // Return URLs immediately (they'll work once transcoding completes)
            playbackUrl: getBunnyPlaybackUrl(guid),
            thumbnailUrl: getBunnyThumbnailUrl(guid),
          });
        } catch (bunnyError) {
          console.error('[Upload] Bunny Stream error:', bunnyError);
          // Fall through to local processing if Bunny fails
          console.log('[Upload] Falling back to local video processing');
        }
      }

      // Local FFmpeg processing (fallback or when Bunny not configured)
      const rawKey = generateFileKey(user.id, 'raw', file.name);
      const rawUrl = await uploadToMinio(rawKey, buffer, file.type);

      // Create VideoJob for async processing
      const videoJob = await prisma.videoJob.create({
        data: {
          userId: user.id,
          userTier: user.tier,
          rawFileUrl: rawUrl,
          rawFileSize: file.size,
          mediaType: 'video',
          status: 'pending',
          progress: 0,
        },
      });

      console.log(`[Upload] Created VideoJob ${videoJob.id} for user ${user.id} (local processing)`);

      // Trigger video processing in background (fire and forget)
      triggerVideoProcessing(videoJob.id);

      return NextResponse.json({
        jobId: videoJob.id,
        status: 'processing',
        message: 'Video upload received. Processing will begin shortly.',
      });
    }

    // For audio, create a processing job for normalization and waveform generation
    if (mediaType === 'audio') {
      // Upload raw audio to temp storage
      const rawKey = generateFileKey(user.id, 'raw/audio', file.name);
      const rawUrl = await uploadToMinio(rawKey, buffer, file.type);

      // Create VideoJob for async processing (with mediaType: 'audio')
      const audioJob = await prisma.videoJob.create({
        data: {
          userId: user.id,
          userTier: user.tier,
          rawFileUrl: rawUrl,
          rawFileSize: file.size,
          mediaType: 'audio',
          status: 'pending',
          progress: 0,
        },
      });

      console.log(`[Upload] Created AudioJob ${audioJob.id} for user ${user.id}`);

      // Trigger audio processing in background (fire and forget)
      triggerVideoProcessing(audioJob.id);

      return NextResponse.json({
        jobId: audioJob.id,
        status: 'processing',
        message: 'Audio upload received. Processing will begin shortly.',
      });
    }

    // For images, resize/compress to max width before upload
    if (mediaType === 'image') {
      try {
        // Get image metadata
        const metadata = await sharp(buffer).metadata();

        let processedBuffer: Buffer;
        let outputMimeType = 'image/jpeg';

        // Resize if wider than max width, always compress
        if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
          processedBuffer = await sharp(buffer)
            .resize(IMAGE_MAX_WIDTH, null, { withoutEnlargement: true })
            .jpeg({ quality: IMAGE_QUALITY })
            .toBuffer();
        } else {
          // Just compress without resizing
          processedBuffer = await sharp(buffer)
            .jpeg({ quality: IMAGE_QUALITY })
            .toBuffer();
        }

        // Generate key with .jpg extension since we're converting to JPEG
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const key = generateFileKey(user.id, mediaType, `${baseName}.jpg`);
        const publicUrl = await uploadToMinio(key, processedBuffer, outputMimeType);

        return NextResponse.json({
          url: publicUrl,
        });
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        return NextResponse.json(
          { error: 'Failed to process image' },
          { status: 500 }
        );
      }
    }

    // For panoramas, upload directly without resizing (they need full resolution)
    const key = generateFileKey(user.id, mediaType, file.name);
    const publicUrl = await uploadToMinio(key, buffer, file.type);

    return NextResponse.json({
      url: publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to upload file', details: errorMessage }, { status: 500 });
  }
}
