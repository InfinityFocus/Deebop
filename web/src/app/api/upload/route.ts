import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateFileKey, uploadToMinio } from '@/lib/minio';
import prisma from '@/lib/db';

import { triggerVideoProcessing } from '@/lib/video-job-processor';
// Tier-based file size limits
const FILE_LIMITS = {
  free: {
    image: 500 * 1024, // 500KB
    video: 10 * 1024 * 1024, // 10MB
    audio: 10 * 1024 * 1024, // 10MB
    panorama360: 0, // Not allowed
  },
  standard: {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 50 * 1024 * 1024, // 50MB
    panorama360: 0, // Not allowed
  },
  pro: {
    image: 50 * 1024 * 1024, // 50MB
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

    // Check panorama permission
    if (mediaType === 'panorama360' && user.tier !== 'pro') {
      return NextResponse.json(
        { error: '360 panoramas require Pro tier' },
        { status: 403 }
      );
    }

    // Check file size limit
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

    // Generate file key and upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());

    // For videos, create a processing job instead of returning URL directly
    if (mediaType === 'video') {
      // Upload raw video to temp storage
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

      console.log(`[Upload] Created VideoJob ${videoJob.id} for user ${user.id}`);

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

    // For images and panoramas, upload directly and return URL
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
