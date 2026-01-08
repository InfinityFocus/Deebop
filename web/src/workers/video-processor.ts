/**
 * Video Processing Worker
 *
 * Standalone worker that polls the database for pending video jobs
 * and processes them using FFmpeg.
 *
 * Run with: npx ts-node src/workers/video-processor.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import prisma from '../lib/db';
import {
  getVideoMetadata,
  validateForTier,
  transcodeVideo,
  generateThumbnail,
  createTempDir,
  cleanupTempDir,
  checkFFmpegAvailable,
  TIER_VIDEO_LIMITS,
  formatDuration,
  getResolutionString,
} from '../lib/video-processing';
import {
  downloadFromMinio,
  uploadToMinio,
  extractKeyFromUrl,
  deleteFromMinio,
  generateFileKey,
} from '../lib/minio';

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface ProcessingResult {
  success: boolean;
  outputUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Claim a pending job (atomic update to prevent race conditions)
 */
async function claimNextJob() {
  // Find and claim a pending job atomically
  const job = await prisma.videoJob.findFirst({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) {
    return null;
  }

  // Try to claim it (could fail if another worker grabbed it)
  const claimed = await prisma.videoJob.updateMany({
    where: {
      id: job.id,
      status: 'pending', // Only if still pending
    },
    data: {
      status: 'processing',
      updatedAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    // Another worker claimed it
    return null;
  }

  // Return the full job data
  return prisma.videoJob.findUnique({
    where: { id: job.id },
    include: { user: true },
  });
}

/**
 * Reset stale jobs that have been processing too long
 */
async function resetStaleJobs() {
  const staleTime = new Date(Date.now() - STALE_JOB_TIMEOUT_MS);

  const result = await prisma.videoJob.updateMany({
    where: {
      status: 'processing',
      updatedAt: { lt: staleTime },
    },
    data: {
      status: 'pending',
      progress: 0,
      errorMessage: 'Job timed out and was reset',
    },
  });

  if (result.count > 0) {
    console.log(`[Worker] Reset ${result.count} stale job(s)`);
  }
}

/**
 * Process a single video job
 */
async function processJob(
  job: NonNullable<Awaited<ReturnType<typeof claimNextJob>>>
): Promise<ProcessingResult> {
  const tempDir = createTempDir();
  console.log(`[Job ${job.id}] Processing started`);
  console.log(`[Job ${job.id}] User tier: ${job.userTier}`);
  console.log(`[Job ${job.id}] Raw file: ${job.rawFileUrl}`);

  try {
    // Update progress
    await updateJobProgress(job.id, 5);

    // 1. Download raw file from storage
    console.log(`[Job ${job.id}] Downloading raw file...`);
    const rawKey = extractKeyFromUrl(job.rawFileUrl);
    const rawBuffer = await downloadFromMinio(rawKey);

    const inputPath = path.join(tempDir, 'input.mp4');
    fs.writeFileSync(inputPath, rawBuffer);
    await updateJobProgress(job.id, 15);

    // 2. Extract metadata
    console.log(`[Job ${job.id}] Extracting metadata...`);
    const metadata = await getVideoMetadata(inputPath);
    console.log(
      `[Job ${job.id}] Video: ${metadata.width}x${metadata.height}, ${formatDuration(metadata.duration)}, ${metadata.codec}`
    );
    await updateJobProgress(job.id, 20);

    // 3. Validate against tier limits
    const validation = validateForTier(metadata, job.userTier);

    if (!validation.valid) {
      // Duration exceeded - reject the video
      throw new Error(validation.errors.join('; '));
    }

    let outputPath = inputPath;
    let finalWidth = metadata.width;
    let finalHeight = metadata.height;

    // 4. Transcode if needed
    if (validation.needsTranscode && validation.targetWidth && validation.targetHeight) {
      console.log(
        `[Job ${job.id}] Transcoding to ${validation.targetWidth}x${validation.targetHeight}...`
      );
      outputPath = path.join(tempDir, 'output.mp4');
      const limits = TIER_VIDEO_LIMITS[job.userTier] || TIER_VIDEO_LIMITS.free;

      await transcodeVideo(
        inputPath,
        outputPath,
        validation.targetWidth,
        validation.targetHeight,
        limits.audioBitrate,
        (percent) => {
          // Map 20-80% progress range for transcoding
          const progress = 20 + Math.round(percent * 0.6);
          updateJobProgress(job.id, progress).catch(console.error);
        }
      );

      finalWidth = validation.targetWidth;
      finalHeight = validation.targetHeight;
      console.log(`[Job ${job.id}] Transcoding complete`);
    } else {
      console.log(`[Job ${job.id}] No transcoding needed`);
    }
    await updateJobProgress(job.id, 80);

    // 5. Generate thumbnail
    console.log(`[Job ${job.id}] Generating thumbnail...`);
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    const thumbnailTimestamp = Math.min(1, metadata.duration / 2);
    await generateThumbnail(outputPath, thumbnailPath, thumbnailTimestamp);
    await updateJobProgress(job.id, 85);

    // 6. Upload processed files to storage
    console.log(`[Job ${job.id}] Uploading processed files...`);

    // Upload video
    const videoKey = generateFileKey(job.userId, 'video', 'processed.mp4');
    const videoBuffer = fs.readFileSync(outputPath);
    const outputUrl = await uploadToMinio(videoKey, videoBuffer, 'video/mp4');
    await updateJobProgress(job.id, 92);

    // Upload thumbnail
    const thumbKey = generateFileKey(job.userId, 'thumbnail', 'thumb.jpg');
    const thumbBuffer = fs.readFileSync(thumbnailPath);
    const thumbnailUrl = await uploadToMinio(thumbKey, thumbBuffer, 'image/jpeg');
    await updateJobProgress(job.id, 98);

    // 7. Delete raw file from temp storage
    try {
      await deleteFromMinio(rawKey);
      console.log(`[Job ${job.id}] Deleted raw file`);
    } catch (error) {
      console.warn(`[Job ${job.id}] Failed to delete raw file:`, error);
    }

    console.log(`[Job ${job.id}] Processing complete!`);
    console.log(`[Job ${job.id}] Output: ${getResolutionString(finalWidth, finalHeight)}`);

    return {
      success: true,
      outputUrl,
      thumbnailUrl,
      duration: metadata.duration,
      width: finalWidth,
      height: finalHeight,
    };
  } catch (error) {
    console.error(`[Job ${job.id}] Processing failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Clean up temp files
    cleanupTempDir(tempDir);
  }
}

/**
 * Update job progress in database
 */
async function updateJobProgress(jobId: string, progress: number) {
  await prisma.videoJob.update({
    where: { id: jobId },
    data: { progress, updatedAt: new Date() },
  });
}

/**
 * Mark job as completed
 */
async function completeJob(jobId: string, result: ProcessingResult) {
  // Update job
  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      progress: 100,
      outputUrl: result.outputUrl,
      thumbnailUrl: result.thumbnailUrl,
      durationSeconds: result.duration,
      width: result.width,
      height: result.height,
      processedAt: new Date(),
    },
  });

  // Update linked post if exists
  const job = await prisma.videoJob.findUnique({
    where: { id: jobId },
    select: { postId: true },
  });

  if (job?.postId) {
    await prisma.post.update({
      where: { id: job.postId },
      data: {
        mediaUrl: result.outputUrl,
        mediaThumbnailUrl: result.thumbnailUrl,
        mediaDurationSeconds: result.duration,
        mediaWidth: result.width,
        mediaHeight: result.height,
      },
    });
  }
}

/**
 * Mark job as failed
 */
async function failJob(jobId: string, error: string) {
  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      errorMessage: error,
    },
  });
}

/**
 * Main worker loop
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Video Processing Worker Starting...');
  console.log('='.repeat(50));

  // Check FFmpeg availability
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.error('ERROR: FFmpeg is not available!');
    console.error('Please install FFmpeg and ensure it is in your PATH.');
    process.exit(1);
  }
  console.log('FFmpeg: Available');
  console.log(`Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log('');
  console.log('Waiting for jobs...');
  console.log('');

  let jobsProcessed = 0;

  while (true) {
    try {
      // Reset any stale jobs
      await resetStaleJobs();

      // Try to claim a job
      const job = await claimNextJob();

      if (job) {
        jobsProcessed++;
        console.log('');
        console.log(`[Job ${job.id}] ===== Job #${jobsProcessed} =====`);

        const result = await processJob(job);

        if (result.success) {
          await completeJob(job.id, result);
          console.log(`[Job ${job.id}] Status: COMPLETED`);
        } else {
          await failJob(job.id, result.error || 'Unknown error');
          console.log(`[Job ${job.id}] Status: FAILED - ${result.error}`);
        }

        console.log('');
      }
    } catch (error) {
      console.error('Worker error:', error);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down worker...');
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down worker...');
  prisma.$disconnect();
  process.exit(0);
});

// Start the worker
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
