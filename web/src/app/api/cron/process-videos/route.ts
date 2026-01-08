import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { uploadToMinio, downloadFromMinio, extractKeyFromUrl, getPublicUrl } from '@/lib/minio';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// FFmpeg paths - use env var or fallback to winget install location
const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  'C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe';
const FFPROBE_PATH = process.env.FFPROBE_PATH ||
  'C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffprobe.exe';

// Tier-based video settings
const TIER_SETTINGS = {
  free: { maxDuration: 30, scale: '720', bitrate: '1500k' },
  standard: { maxDuration: 60, scale: '1080', bitrate: '4000k' },
  pro: { maxDuration: 300, scale: null, bitrate: '12000k' },
};

// Check if FFmpeg is available
async function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

// Get video metadata using FFprobe
async function getVideoMetadata(inputPath: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFPROBE_PATH, [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-show_entries', 'format=duration',
      '-of', 'json',
      inputPath,
    ]);

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => (stdout += data));
    proc.stderr.on('data', (data) => (stderr += data));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed: ${stderr}`));
        return;
      }
      try {
        const data = JSON.parse(stdout);
        const stream = data.streams?.[0] || {};
        const format = data.format || {};
        resolve({
          duration: parseFloat(stream.duration || format.duration || '0'),
          width: stream.width || 0,
          height: stream.height || 0,
        });
      } catch (e) {
        reject(new Error('Failed to parse FFprobe output'));
      }
    });
  });
}

// Transcode video with FFmpeg
async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  settings: { maxDuration: number; scale: string | null; bitrate: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-b:v', settings.bitrate,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
    ];

    if (settings.scale) {
      args.push('-vf', `scale=-2:${settings.scale}`);
    }

    args.push('-y', outputPath);

    const proc = spawn(FFMPEG_PATH, args);
    let stderr = '';
    proc.stderr.on('data', (data) => (stderr += data));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed: ${stderr.slice(-500)}`));
      } else {
        resolve();
      }
    });
  });
}

// Generate thumbnail with FFmpeg
async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, [
      '-i', inputPath,
      '-ss', '1',
      '-vframes', '1',
      '-vf', 'scale=640:-2',
      '-y', outputPath,
    ]);

    let stderr = '';
    proc.stderr.on('data', (data) => (stderr += data));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Thumbnail generation failed: ${stderr.slice(-500)}`));
      } else {
        resolve();
      }
    });
  });
}

// Process a single video job
async function processVideoJob(jobId: string): Promise<void> {
  // Mark as processing
  await prisma.videoJob.update({
    where: { id: jobId },
    data: { status: 'processing', progress: 10 },
  });

  const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  const settings = TIER_SETTINGS[job.userTier as keyof typeof TIER_SETTINGS] || TIER_SETTINGS.free;
  const tempDir = join(tmpdir(), 'deebop-video');

  try {
    await mkdir(tempDir, { recursive: true });
  } catch {}

  const timestamp = Date.now();
  const inputPath = join(tempDir, `input_${timestamp}.mp4`);
  const outputPath = join(tempDir, `output_${timestamp}.mp4`);
  const thumbPath = join(tempDir, `thumb_${timestamp}.jpg`);

  try {
    // Download raw file from MinIO
    const rawKey = extractKeyFromUrl(job.rawFileUrl);
    const rawBuffer = await downloadFromMinio(rawKey);
    await writeFile(inputPath, rawBuffer);

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress: 20 },
    });

    // Get metadata
    const metadata = await getVideoMetadata(inputPath);

    if (metadata.duration > settings.maxDuration) {
      throw new Error(`Video exceeds ${settings.maxDuration}s limit for ${job.userTier} tier`);
    }

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress: 30 },
    });

    // Transcode
    await transcodeVideo(inputPath, outputPath, settings);

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress: 70 },
    });

    // Generate thumbnail
    await generateThumbnail(inputPath, thumbPath);

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress: 80 },
    });

    // Read processed files
    const { readFile } = await import('fs/promises');
    const outputBuffer = await readFile(outputPath);
    const thumbBuffer = await readFile(thumbPath);

    // Upload to MinIO
    const outputKey = rawKey.replace('raw/', 'video/').replace(/\.[^.]+$/, '.mp4');
    const thumbKey = outputKey.replace('.mp4', '_thumb.jpg');

    await uploadToMinio(outputKey, outputBuffer, 'video/mp4');
    await uploadToMinio(thumbKey, thumbBuffer, 'image/jpeg');

    await prisma.videoJob.update({
      where: { id: jobId },
      data: { progress: 90 },
    });

    // Get new metadata from output
    const outputMetadata = await getVideoMetadata(outputPath);

    // Update job as completed
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        outputUrl: getPublicUrl(outputKey),
        thumbnailUrl: getPublicUrl(thumbKey),
        durationSeconds: outputMetadata.duration,
        width: outputMetadata.width,
        height: outputMetadata.height,
        processedAt: new Date(),
      },
    });

    console.log(`[VideoProcessor] Job ${jobId} completed successfully`);
  } finally {
    // Cleanup temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
      unlink(thumbPath).catch(() => {}),
    ]);
  }
}

// GET /api/cron/process-videos - Process pending video jobs
export async function GET(request: NextRequest) {
  // Optional: Add API key check for cron security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow in development without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Check if FFmpeg is available
    const hasFfmpeg = await checkFfmpeg();
    if (!hasFfmpeg) {
      return NextResponse.json({
        error: 'FFmpeg not installed',
        message: 'Install FFmpeg to process videos: https://ffmpeg.org/download.html',
        pendingJobs: await prisma.videoJob.count({ where: { status: 'pending' } }),
      }, { status: 503 });
    }

    // Get pending jobs (limit to 1 per cron run to avoid timeout)
    const pendingJobs = await prisma.videoJob.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 1,
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({ message: 'No pending video jobs' });
    }

    const job = pendingJobs[0];

    try {
      await processVideoJob(job.id);
      return NextResponse.json({
        success: true,
        processed: job.id,
        remaining: await prisma.videoJob.count({ where: { status: 'pending' } }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Mark job as failed
      await prisma.videoJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMessage },
      });

      return NextResponse.json({
        error: 'Processing failed',
        jobId: job.id,
        message: errorMessage,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Process videos cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
