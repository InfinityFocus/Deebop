/**
 * Media Processing Worker
 *
 * Unified worker that polls the database for pending media jobs (video & audio)
 * and processes them using FFmpeg.
 *
 * Run with: npx ts-node src/workers/media-processor.ts
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
  getAudioMetadata,
  validateAudioForTier,
  normalizeAudio,
  generateWaveformData,
  TIER_AUDIO_LIMITS,
  formatAudioDuration,
} from '../lib/audio-processing';
import {
  downloadFromMinio,
  uploadToMinio,
  extractKeyFromUrl,
  deleteFromMinio,
  generateFileKey,
} from '../lib/minio';

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

interface VideoProcessingResult {
  success: boolean;
  outputUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
}

interface AudioProcessingResult {
  success: boolean;
  outputUrl?: string;
  waveformUrl?: string;
  duration?: number;
  error?: string;
}

type ProcessingResult = VideoProcessingResult | AudioProcessingResult;

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
 * Update job progress in database
 */
async function updateJobProgress(jobId: string, progress: number) {
  await prisma.videoJob.update({
    where: { id: jobId },
    data: { progress, updatedAt: new Date() },
  });
}

/**
 * Process a video job
 */
async function processVideoJob(
  job: NonNullable<Awaited<ReturnType<typeof claimNextJob>>>
): Promise<VideoProcessingResult> {
  const tempDir = createTempDir();
  console.log(`[Job ${job.id}] Processing VIDEO started`);
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

    const videoKey = generateFileKey(job.userId, 'video', 'processed.mp4');
    const videoBuffer = fs.readFileSync(outputPath);
    const outputUrl = await uploadToMinio(videoKey, videoBuffer, 'video/mp4');
    await updateJobProgress(job.id, 92);

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
    cleanupTempDir(tempDir);
  }
}

/**
 * Process an audio job
 */
async function processAudioJob(
  job: NonNullable<Awaited<ReturnType<typeof claimNextJob>>>
): Promise<AudioProcessingResult> {
  const tempDir = createTempDir();
  console.log(`[Job ${job.id}] Processing AUDIO started`);
  console.log(`[Job ${job.id}] User tier: ${job.userTier}`);
  console.log(`[Job ${job.id}] Raw file: ${job.rawFileUrl}`);

  try {
    // Update progress
    await updateJobProgress(job.id, 5);

    // 1. Download raw file from storage
    console.log(`[Job ${job.id}] Downloading raw file...`);
    const rawKey = extractKeyFromUrl(job.rawFileUrl);
    const rawBuffer = await downloadFromMinio(rawKey);

    // Determine file extension from URL
    const urlParts = job.rawFileUrl.split('.');
    const ext = urlParts[urlParts.length - 1] || 'mp3';
    const inputPath = path.join(tempDir, `input.${ext}`);
    fs.writeFileSync(inputPath, rawBuffer);
    await updateJobProgress(job.id, 15);

    // 2. Extract metadata
    console.log(`[Job ${job.id}] Extracting audio metadata...`);
    const metadata = await getAudioMetadata(inputPath);
    console.log(
      `[Job ${job.id}] Audio: ${formatAudioDuration(metadata.duration)}, ${metadata.codec}, ${metadata.sampleRate}Hz, ${metadata.channels}ch`
    );
    await updateJobProgress(job.id, 20);

    // 3. Validate against tier limits
    const validation = validateAudioForTier(metadata, job.rawFileSize, job.userTier);

    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }
    await updateJobProgress(job.id, 25);

    // 4. Normalize audio
    console.log(`[Job ${job.id}] Normalizing audio...`);
    const outputPath = path.join(tempDir, 'output.m4a');
    const limits = TIER_AUDIO_LIMITS[job.userTier] || TIER_AUDIO_LIMITS.free;

    await normalizeAudio(inputPath, outputPath, limits.outputBitrate, (percent) => {
      const progress = 25 + Math.round(percent * 0.4);
      updateJobProgress(job.id, progress).catch(console.error);
    });
    console.log(`[Job ${job.id}] Audio normalization complete`);
    await updateJobProgress(job.id, 65);

    // 5. Generate waveform data
    console.log(`[Job ${job.id}] Generating waveform...`);
    const waveformData = await generateWaveformData(outputPath, 200);
    const waveformJson = JSON.stringify(waveformData);
    await updateJobProgress(job.id, 80);

    // 6. Upload processed files to storage
    console.log(`[Job ${job.id}] Uploading processed files...`);

    // Upload audio
    const audioKey = generateFileKey(job.userId, 'audio', 'processed.m4a');
    const audioBuffer = fs.readFileSync(outputPath);
    const outputUrl = await uploadToMinio(audioKey, audioBuffer, 'audio/mp4');
    await updateJobProgress(job.id, 90);

    // Upload waveform JSON
    const waveformKey = generateFileKey(job.userId, 'waveform', 'waveform.json');
    const waveformBuffer = Buffer.from(waveformJson, 'utf-8');
    const waveformUrl = await uploadToMinio(waveformKey, waveformBuffer, 'application/json');
    await updateJobProgress(job.id, 98);

    // 7. Delete raw file from temp storage
    try {
      await deleteFromMinio(rawKey);
      console.log(`[Job ${job.id}] Deleted raw file`);
    } catch (error) {
      console.warn(`[Job ${job.id}] Failed to delete raw file:`, error);
    }

    console.log(`[Job ${job.id}] Processing complete!`);
    console.log(`[Job ${job.id}] Duration: ${formatAudioDuration(metadata.duration)}`);

    return {
      success: true,
      outputUrl,
      waveformUrl,
      duration: metadata.duration,
    };
  } catch (error) {
    console.error(`[Job ${job.id}] Processing failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    cleanupTempDir(tempDir);
  }
}

/**
 * Mark video job as completed
 */
async function completeVideoJob(jobId: string, result: VideoProcessingResult) {
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
 * Mark audio job as completed
 */
async function completeAudioJob(jobId: string, result: AudioProcessingResult) {
  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      progress: 100,
      outputUrl: result.outputUrl,
      waveformUrl: result.waveformUrl,
      durationSeconds: result.duration,
      processedAt: new Date(),
    },
  });

  const job = await prisma.videoJob.findUnique({
    where: { id: jobId },
    select: { postId: true },
  });

  if (job?.postId) {
    await prisma.post.update({
      where: { id: job.postId },
      data: {
        mediaUrl: result.outputUrl,
        mediaDurationSeconds: result.duration,
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
  console.log('Media Processing Worker Starting...');
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
  console.log('Supported types: VIDEO, AUDIO');
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
        const mediaType = (job as { mediaType?: string }).mediaType || 'video';
        console.log('');
        console.log(`[Job ${job.id}] ===== Job #${jobsProcessed} (${mediaType.toUpperCase()}) =====`);

        if (mediaType === 'audio') {
          const result = await processAudioJob(job);
          if (result.success) {
            await completeAudioJob(job.id, result);
            console.log(`[Job ${job.id}] Status: COMPLETED`);
          } else {
            await failJob(job.id, result.error || 'Unknown error');
            console.log(`[Job ${job.id}] Status: FAILED - ${result.error}`);
          }
        } else {
          // Default to video processing
          const result = await processVideoJob(job);
          if (result.success) {
            await completeVideoJob(job.id, result);
            console.log(`[Job ${job.id}] Status: COMPLETED`);
          } else {
            await failJob(job.id, result.error || 'Unknown error');
            console.log(`[Job ${job.id}] Status: FAILED - ${result.error}`);
          }
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
