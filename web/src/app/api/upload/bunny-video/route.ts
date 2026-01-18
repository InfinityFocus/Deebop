import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  isBunnyStreamEnabled,
  createBunnyVideo,
  getBunnyPlaybackUrl,
  getBunnyThumbnailUrl,
} from '@/lib/bunny-stream';

// Tier-based video file size limits
const VIDEO_SIZE_LIMITS = {
  free: 50 * 1024 * 1024, // 50MB
  creator: 200 * 1024 * 1024, // 200MB
  pro: 500 * 1024 * 1024, // 500MB
  teams: 500 * 1024 * 1024, // 500MB
};

// Tier-based video duration limits (in seconds)
const VIDEO_DURATION_LIMITS = {
  free: 30, // 30 seconds
  creator: 180, // 3 minutes
  pro: 600, // 10 minutes
  teams: 600, // 10 minutes
};

/**
 * POST /api/upload/bunny-video
 * Initialize a video upload to Bunny Stream
 * Returns configuration for TUS upload directly to Bunny
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Bunny Stream is configured
    if (!isBunnyStreamEnabled()) {
      return NextResponse.json(
        { error: 'Video uploads are not configured. Please try again later.' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { filename, fileSize, contentType } = body;

    if (!filename || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, fileSize' },
        { status: 400 }
      );
    }

    // Check file size limit based on tier
    const tier = user.tier as keyof typeof VIDEO_SIZE_LIMITS;
    const maxSize = VIDEO_SIZE_LIMITS[tier] || VIDEO_SIZE_LIMITS.free;
    const maxMB = Math.round(maxSize / 1024 / 1024);

    if (fileSize > maxSize) {
      return NextResponse.json(
        {
          error: `Video file too large. Max size for your tier: ${maxMB}MB`,
          maxSize,
          maxMB,
          tier: user.tier,
        },
        { status: 400 }
      );
    }

    // Create video in Bunny Stream
    const videoTitle = `${user.username}_${Date.now()}_${filename.replace(/\.[^.]+$/, '')}`;
    const { guid } = await createBunnyVideo(videoTitle);

    console.log(`[BunnyVideo] Created video ${guid} for user ${user.id}`);

    // Create VideoJob record to track the upload
    const videoJob = await prisma.videoJob.create({
      data: {
        userId: user.id,
        userTier: user.tier,
        rawFileUrl: `bunny:${guid}`,
        rawFileSize: fileSize,
        mediaType: 'video',
        status: 'pending', // Will be 'processing' once uploaded
        progress: 0,
        outputUrl: getBunnyPlaybackUrl(guid),
        thumbnailUrl: getBunnyThumbnailUrl(guid),
      },
    });

    // Bunny Stream TUS endpoint
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    const apiKey = process.env.BUNNY_STREAM_API_KEY;

    return NextResponse.json({
      jobId: videoJob.id,
      bunnyGuid: guid,
      // TUS upload configuration for direct upload to Bunny
      tusEndpoint: `https://video.bunnycdn.com/tusupload`,
      tusHeaders: {
        AuthorizationSignature: guid, // Bunny uses video GUID for auth
        AuthorizationExpire: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        VideoId: guid,
        LibraryId: libraryId,
      },
      // For direct PUT upload (alternative to TUS)
      directUploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`,
      directUploadHeaders: {
        AccessKey: apiKey,
      },
      // URLs that will work once upload + transcoding completes
      playbackUrl: getBunnyPlaybackUrl(guid),
      thumbnailUrl: getBunnyThumbnailUrl(guid),
      // Tier limits for client-side validation
      maxDurationSeconds: VIDEO_DURATION_LIMITS[tier] || VIDEO_DURATION_LIMITS.free,
      maxFileSizeMB: maxMB,
    });
  } catch (error) {
    console.error('[BunnyVideo] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize video upload' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/upload/bunny-video
 * Update video job status after upload completes
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, status } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required field: jobId' },
        { status: 400 }
      );
    }

    // Update the video job
    const videoJob = await prisma.videoJob.update({
      where: {
        id: jobId,
        userId: user.id, // Ensure user owns this job
      },
      data: {
        status: status || 'processing',
        progress: status === 'completed' ? 100 : 50,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: videoJob.id,
      status: videoJob.status,
    });
  } catch (error) {
    console.error('[BunnyVideo] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update video status' },
      { status: 500 }
    );
  }
}
