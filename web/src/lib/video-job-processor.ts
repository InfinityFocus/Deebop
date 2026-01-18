/**
 * VideoJob Processing Library
 * Handles automatic video and audio transcoding after upload
 */

import prisma from "@/lib/db";
import { uploadToMinio, downloadFromMinio, extractKeyFromUrl, getPublicUrl } from "@/lib/minio";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// FFmpeg paths - use env var or fallback to common locations
const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  (process.platform === "win32"
    ? "C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe"
    : "ffmpeg");
const FFPROBE_PATH = process.env.FFPROBE_PATH ||
  (process.platform === "win32"
    ? "C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffprobe.exe"
    : "ffprobe");

// Tier-based transcoding settings
// All tiers cap at 1080p for consistent quality and storage efficiency
const TRANSCODE_SETTINGS = {
  free: { maxDuration: 60, scale: "1080", bitrate: "3000k" },       // 1 minute
  creator: { maxDuration: 180, scale: "1080", bitrate: "4000k" },   // 3 minutes
  pro: { maxDuration: 600, scale: "1080", bitrate: "5000k" },       // 10 minutes
  teams: { maxDuration: 600, scale: "1080", bitrate: "5000k" },     // 10 minutes
};

// Audio duration limits per tier (in seconds)
const AUDIO_DURATION_LIMITS = {
  free: 60,       // 1 minute
  creator: 300,   // 5 minutes
  pro: 1800,      // 30 minutes
  teams: 3600,    // 1 hour
};

export async function checkFfmpegCli(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ["-version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

async function getVideoMetadataCli(inputPath: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFPROBE_PATH, [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration",
      "-show_entries", "format=duration", "-of", "json", inputPath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) { reject(new Error("FFprobe failed: " + stderr)); return; }
      try {
        const data = JSON.parse(stdout);
        const stream = data.streams?.[0] || {};
        const format = data.format || {};
        resolve({
          duration: parseFloat(stream.duration || format.duration || "0"),
          width: stream.width || 0,
          height: stream.height || 0,
        });
      } catch { reject(new Error("Failed to parse FFprobe output")); }
    });
  });
}

async function getAudioMetadataCli(inputPath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFPROBE_PATH, [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=duration",
      "-show_entries", "format=duration", "-of", "json", inputPath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) { reject(new Error("FFprobe failed: " + stderr)); return; }
      try {
        const data = JSON.parse(stdout);
        const stream = data.streams?.[0] || {};
        const format = data.format || {};
        resolve({
          duration: parseFloat(stream.duration || format.duration || "0"),
        });
      } catch { reject(new Error("Failed to parse FFprobe output")); }
    });
  });
}

async function transcodeVideoCli(inputPath: string, outputPath: string, settings: { maxDuration: number; scale: string | null; bitrate: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ["-i", inputPath, "-c:v", "libx264", "-preset", "fast", "-b:v", settings.bitrate, "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-pix_fmt", "yuv420p"];
    // Scale to max 1080p height, but don't upscale smaller videos
    // The filter: if height > 1080, scale to 1080p; otherwise keep original size
    if (settings.scale) {
      args.push("-vf", `scale=-2:'min(${settings.scale},ih)'`);
    }
    args.push("-y", outputPath);
    const proc = spawn(FFMPEG_PATH, args);
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => code !== 0 ? reject(new Error("FFmpeg failed: " + stderr.slice(-500))) : resolve());
  });
}

async function transcodeAudioCli(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Transcode to AAC in M4A container for good quality and compatibility
    const args = ["-i", inputPath, "-c:a", "aac", "-b:a", "192k", "-y", outputPath];
    const proc = spawn(FFMPEG_PATH, args);
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => code !== 0 ? reject(new Error("Audio transcode failed: " + stderr.slice(-500))) : resolve());
  });
}

async function generateThumbnailCli(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, ["-i", inputPath, "-ss", "1", "-vframes", "1", "-vf", "scale=640:-2", "-y", outputPath]);
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code) => code !== 0 ? reject(new Error("Thumbnail failed: " + stderr.slice(-500))) : resolve());
  });
}

export async function processVideoJob(jobId: string): Promise<void> {
  await prisma.videoJob.update({ where: { id: jobId }, data: { status: "processing", progress: 10 } });
  const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  // Route to appropriate processor based on mediaType
  if (job.mediaType === "audio") {
    await processAudioJob(jobId, job);
  } else {
    await processVideoJobInternal(jobId, job);
  }
}

async function processVideoJobInternal(jobId: string, job: { rawFileUrl: string; userTier: string }): Promise<void> {
  const settings = TRANSCODE_SETTINGS[job.userTier as keyof typeof TRANSCODE_SETTINGS] || TRANSCODE_SETTINGS.free;
  const tempDir = join(tmpdir(), "deebop-video");
  try { await mkdir(tempDir, { recursive: true }); } catch {}
  const ts = Date.now();
  const inputPath = join(tempDir, "input_" + ts + ".mp4");
  const outputPath = join(tempDir, "output_" + ts + ".mp4");
  const thumbPath = join(tempDir, "thumb_" + ts + ".jpg");
  try {
    const rawKey = extractKeyFromUrl(job.rawFileUrl);
    const rawBuffer = await downloadFromMinio(rawKey);
    await writeFile(inputPath, rawBuffer);
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 20 } });
    const metadata = await getVideoMetadataCli(inputPath);
    if (metadata.duration > settings.maxDuration) throw new Error("Video exceeds " + settings.maxDuration + "s limit");
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 30 } });
    await transcodeVideoCli(inputPath, outputPath, settings);
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 70 } });
    await generateThumbnailCli(inputPath, thumbPath);
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 80 } });
    const outputBuffer = await readFile(outputPath);
    const thumbBuffer = await readFile(thumbPath);
    const outputKey = rawKey.replace("raw/", "video/").replace(/\.[^.]+$/, ".mp4");
    const thumbKey = outputKey.replace(".mp4", "_thumb.jpg");
    await uploadToMinio(outputKey, outputBuffer, "video/mp4");
    await uploadToMinio(thumbKey, thumbBuffer, "image/jpeg");
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 90 } });
    const outputMeta = await getVideoMetadataCli(outputPath);
    const updatedJob = await prisma.videoJob.update({
      where: { id: jobId },
      data: { status: "completed", progress: 100, outputUrl: getPublicUrl(outputKey), thumbnailUrl: getPublicUrl(thumbKey), durationSeconds: outputMeta.duration, width: outputMeta.width, height: outputMeta.height, processedAt: new Date() },
    });
    // Also update the linked Post with duration
    if (updatedJob.postId) {
      await prisma.post.update({
        where: { id: updatedJob.postId },
        data: { mediaDurationSeconds: outputMeta.duration, mediaWidth: outputMeta.width, mediaHeight: outputMeta.height },
      });
    }
    console.log("[VideoProcessor] Job " + jobId + " completed");
  } finally {
    await Promise.all([unlink(inputPath).catch(() => {}), unlink(outputPath).catch(() => {}), unlink(thumbPath).catch(() => {})]);
  }
}

async function processAudioJob(jobId: string, job: { rawFileUrl: string; userTier: string }): Promise<void> {
  const maxDuration = AUDIO_DURATION_LIMITS[job.userTier as keyof typeof AUDIO_DURATION_LIMITS] || AUDIO_DURATION_LIMITS.free;
  const tempDir = join(tmpdir(), "deebop-audio");
  try { await mkdir(tempDir, { recursive: true }); } catch {}
  const ts = Date.now();
  const inputPath = join(tempDir, "input_" + ts + ".webm");
  const outputPath = join(tempDir, "output_" + ts + ".m4a");
  try {
    const rawKey = extractKeyFromUrl(job.rawFileUrl);
    const rawBuffer = await downloadFromMinio(rawKey);
    await writeFile(inputPath, rawBuffer);
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 20 } });

    // Get audio metadata
    const metadata = await getAudioMetadataCli(inputPath);
    if (metadata.duration > maxDuration) throw new Error("Audio exceeds " + maxDuration + "s limit");
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 30 } });

    // Transcode audio
    await transcodeAudioCli(inputPath, outputPath);
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 70 } });

    // Upload processed audio
    const outputBuffer = await readFile(outputPath);
    const outputKey = rawKey.replace("raw/audio/", "audio/").replace(/\.[^.]+$/, ".m4a");
    await uploadToMinio(outputKey, outputBuffer, "audio/mp4");
    await prisma.videoJob.update({ where: { id: jobId }, data: { progress: 90 } });

    // Get final duration
    const outputMeta = await getAudioMetadataCli(outputPath);
    const updatedJob = await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        outputUrl: getPublicUrl(outputKey),
        durationSeconds: outputMeta.duration,
        processedAt: new Date()
      },
    });
    // Also update the linked Post with duration
    if (updatedJob.postId) {
      await prisma.post.update({
        where: { id: updatedJob.postId },
        data: { mediaDurationSeconds: outputMeta.duration },
      });
    }
    console.log("[AudioProcessor] Job " + jobId + " completed");
  } finally {
    await Promise.all([unlink(inputPath).catch(() => {}), unlink(outputPath).catch(() => {})]);
  }
}

export async function processVideoJobSafe(jobId: string): Promise<{ success: boolean; error?: string }> {
  try { await processVideoJob(jobId); return { success: true }; }
  catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.videoJob.update({ where: { id: jobId }, data: { status: "failed", errorMessage: msg } });
    console.error("[VideoProcessor] Job " + jobId + " failed:", msg);
    return { success: false, error: msg };
  }
}

export function triggerVideoProcessing(jobId: string): void {
  checkFfmpegCli().then(async (ok) => {
    if (!ok) {
      console.warn("[VideoProcessor] FFmpeg not available, attempting fallback for job " + jobId);
      // Fall back to accepting raw file without processing
      await processJobWithoutFfmpeg(jobId);
      return;
    }
    processVideoJobSafe(jobId).catch((e) => console.error("[VideoProcessor] Error:", e));
  });
}

// Fallback for when FFmpeg is not available (e.g., Vercel serverless)
// This accepts the raw uploaded file as-is without transcoding
async function processJobWithoutFfmpeg(jobId: string): Promise<void> {
  try {
    const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job not found");

    await prisma.videoJob.update({ where: { id: jobId }, data: { status: "processing", progress: 50 } });

    // For audio, we can accept the raw file as-is (most browsers support webm/mp3/etc)
    if (job.mediaType === "audio") {
      // Just use the raw file URL as the output
      await prisma.videoJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          progress: 100,
          outputUrl: job.rawFileUrl,
          processedAt: new Date()
        },
      });
      console.log("[AudioProcessor] Job " + jobId + " completed (no transcoding - FFmpeg not available)");
      return;
    }

    // For video without FFmpeg, we also accept raw file but warn that quality may vary
    await prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        outputUrl: job.rawFileUrl,
        processedAt: new Date()
      },
    });
    console.log("[VideoProcessor] Job " + jobId + " completed (no transcoding - FFmpeg not available)");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.videoJob.update({ where: { id: jobId }, data: { status: "failed", errorMessage: msg } });
    console.error("[VideoProcessor] Fallback failed for job " + jobId + ":", msg);
  }
}
