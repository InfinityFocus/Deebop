/**
 * Video Editor Processor
 * Handles FFmpeg processing for multi-clip video projects with filters, overlays, and effects
 */

import prisma from "@/lib/db";
import { uploadToMinio, downloadFromMinio, extractKeyFromUrl, getPublicUrl } from "@/lib/minio";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { getFfmpegFilter, getSpeedFilters, generateDrawtextFilter } from "@/lib/video-filters";

// FFmpeg paths - use env var or fallback to common locations
const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  (process.platform === "win32"
    ? "C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffmpeg.exe"
    : "ffmpeg");
const FFPROBE_PATH = process.env.FFPROBE_PATH ||
  (process.platform === "win32"
    ? "C:/Users/maxim/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0.1-full_build/bin/ffprobe.exe"
    : "ffprobe");

// Tier-based output settings
const OUTPUT_SETTINGS = {
  free: { bitrate: "3000k", audioBitrate: "128k" },
  standard: { bitrate: "4000k", audioBitrate: "192k" },
  pro: { bitrate: "5000k", audioBitrate: "256k" },
};

interface VideoClip {
  id: string;
  sourceUrl: string;
  sourceDuration: number;
  sourceWidth: number | null;
  sourceHeight: number | null;
  sortOrder: number;
  trimStart: number;
  trimEnd: number | null;
  speed: number;
  filterPreset: string | null;
  volume: number;
}

interface VideoOverlay {
  id: string;
  type: string;
  positionX: number;
  positionY: number;
  startTime: number;
  endTime: number | null;
  text: string | null;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string | null;
}

interface VideoProject {
  id: string;
  userId: string;
  name: string;
  maxDurationSeconds: number;
  currentDurationSeconds: number | null;
  clips: VideoClip[];
  overlays: VideoOverlay[];
}

/**
 * Check if FFmpeg is available
 */
export async function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ["-version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Get video metadata using ffprobe
 */
async function getVideoMetadata(inputPath: string): Promise<{ duration: number; width: number; height: number }> {
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

/**
 * Run FFmpeg command with progress tracking
 */
async function runFfmpeg(args: string[], onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args);
    let stderr = "";

    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
      // Parse progress from FFmpeg output
      if (onProgress) {
        const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          // Basic progress indication
          onProgress(50); // Simplified - would need total duration for accurate %
        }
      }
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("FFmpeg failed: " + stderr.slice(-1000)));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Process a single clip - apply trim, speed, and filter
 */
async function processClip(
  clip: VideoClip,
  inputPath: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  const args: string[] = ["-i", inputPath];

  // Build filter chain
  const filters: string[] = [];

  // Trim filter
  const trimEnd = clip.trimEnd ?? clip.sourceDuration;
  args.push("-ss", clip.trimStart.toString());
  args.push("-t", (trimEnd - clip.trimStart).toString());

  // Scale to match target resolution
  filters.push(`scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`);

  // Speed adjustment (video)
  if (clip.speed !== 1) {
    const speedFilters = getSpeedFilters(clip.speed);
    if (speedFilters.video) {
      filters.push(speedFilters.video);
    }
  }

  // Color filter
  const ffmpegFilter = getFfmpegFilter(clip.filterPreset);
  if (ffmpegFilter) {
    filters.push(ffmpegFilter);
  }

  // Apply video filters
  if (filters.length > 0) {
    args.push("-vf", filters.join(","));
  }

  // Audio speed adjustment
  if (clip.speed !== 1) {
    const speedFilters = getSpeedFilters(clip.speed);
    if (speedFilters.audio) {
      args.push("-af", speedFilters.audio);
    }
  }

  // Volume adjustment
  if (clip.volume !== 1) {
    const volumeFilter = `volume=${clip.volume}`;
    const existingAf = args.indexOf("-af");
    if (existingAf !== -1) {
      args[existingAf + 1] = args[existingAf + 1] + "," + volumeFilter;
    } else {
      args.push("-af", volumeFilter);
    }
  }

  // Output settings
  args.push("-c:v", "libx264", "-preset", "fast", "-crf", "23");
  args.push("-c:a", "aac", "-b:a", "192k");
  args.push("-pix_fmt", "yuv420p");
  args.push("-y", outputPath);

  await runFfmpeg(args);
}

/**
 * Concatenate multiple clips using concat demuxer
 */
async function concatenateClips(clipPaths: string[], outputPath: string, tempDir: string): Promise<void> {
  // Create concat file
  const concatFilePath = join(tempDir, "concat.txt");
  const concatContent = clipPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(concatFilePath, concatContent);

  const args = [
    "-f", "concat", "-safe", "0",
    "-i", concatFilePath,
    "-c", "copy",
    "-y", outputPath,
  ];

  await runFfmpeg(args);
  await unlink(concatFilePath).catch(() => {});
}

/**
 * Add text overlays to video using drawtext filter
 */
async function addTextOverlays(
  inputPath: string,
  outputPath: string,
  overlays: VideoOverlay[],
  totalDuration: number,
  settings: { bitrate: string; audioBitrate: string }
): Promise<void> {
  if (overlays.length === 0) {
    // No overlays - just re-encode with final settings
    const args = [
      "-i", inputPath,
      "-c:v", "libx264", "-preset", "medium", "-b:v", settings.bitrate,
      "-c:a", "aac", "-b:a", settings.audioBitrate,
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      "-y", outputPath,
    ];
    await runFfmpeg(args);
    return;
  }

  // Build drawtext filters for each overlay
  const drawtextFilters = overlays
    .filter(o => o.type === "text" && o.text)
    .map(overlay =>
      generateDrawtextFilter(overlay.text!, {
        x: overlay.positionX,
        y: overlay.positionY,
        fontSize: overlay.fontSize,
        fontColor: overlay.fontColor,
        fontFamily: overlay.fontFamily,
        startTime: overlay.startTime,
        endTime: overlay.endTime,
        backgroundColor: overlay.backgroundColor,
      })
    );

  const args = [
    "-i", inputPath,
    "-vf", drawtextFilters.join(","),
    "-c:v", "libx264", "-preset", "medium", "-b:v", settings.bitrate,
    "-c:a", "aac", "-b:a", settings.audioBitrate,
    "-movflags", "+faststart",
    "-pix_fmt", "yuv420p",
    "-y", outputPath,
  ];

  await runFfmpeg(args);
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  const args = [
    "-i", inputPath,
    "-ss", "1",
    "-vframes", "1",
    "-vf", "scale=640:-2",
    "-y", outputPath,
  ];
  await runFfmpeg(args);
}

/**
 * Update project progress in database
 */
async function updateProgress(projectId: string, progress: number): Promise<void> {
  await prisma.videoProject.update({
    where: { id: projectId },
    data: { processingProgress: progress },
  });
}

/**
 * Main processing function for a video project
 */
export async function processVideoProject(projectId: string): Promise<void> {
  // Fetch project with clips and overlays
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    include: {
      clips: { orderBy: { sortOrder: "asc" } },
      overlays: true,
      user: { select: { tier: true } },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.clips.length === 0) {
    throw new Error("Project has no clips");
  }

  const userTier = project.user.tier as keyof typeof OUTPUT_SETTINGS;
  const outputSettings = OUTPUT_SETTINGS[userTier] || OUTPUT_SETTINGS.free;

  // Create temp directory
  const tempDir = join(tmpdir(), `deebop-editor-${projectId}`);
  await mkdir(tempDir, { recursive: true }).catch(() => {});

  const downloadedFiles: string[] = [];
  const processedClips: string[] = [];
  let concatenatedPath = "";
  let finalOutputPath = "";
  let thumbnailPath = "";

  try {
    await updateProgress(projectId, 5);

    // Step 1: Download all source clips (0-20%)
    console.log(`[VideoEditor] Downloading ${project.clips.length} clips...`);

    for (let i = 0; i < project.clips.length; i++) {
      const clip = project.clips[i];
      const inputPath = join(tempDir, `source_${i}.mp4`);

      const key = extractKeyFromUrl(clip.sourceUrl);
      const buffer = await downloadFromMinio(key);
      await writeFile(inputPath, buffer);
      downloadedFiles.push(inputPath);

      const progress = 5 + Math.round((i + 1) / project.clips.length * 15);
      await updateProgress(projectId, progress);
    }

    // Step 2: Determine target resolution (use first clip's resolution)
    const firstClipMeta = await getVideoMetadata(downloadedFiles[0]);
    const targetWidth = Math.min(firstClipMeta.width || 1920, 1920);
    const targetHeight = Math.min(firstClipMeta.height || 1080, 1080);

    await updateProgress(projectId, 25);

    // Step 3: Process each clip individually (25-60%)
    console.log(`[VideoEditor] Processing ${project.clips.length} clips...`);

    for (let i = 0; i < project.clips.length; i++) {
      const clip = project.clips[i];
      const inputPath = downloadedFiles[i];
      const outputPath = join(tempDir, `processed_${i}.mp4`);

      await processClip(clip, inputPath, outputPath, targetWidth, targetHeight);
      processedClips.push(outputPath);

      const progress = 25 + Math.round((i + 1) / project.clips.length * 35);
      await updateProgress(projectId, progress);
    }

    await updateProgress(projectId, 65);

    // Step 4: Concatenate clips if multiple (65-75%)
    console.log(`[VideoEditor] Concatenating clips...`);

    if (processedClips.length === 1) {
      concatenatedPath = processedClips[0];
    } else {
      concatenatedPath = join(tempDir, "concatenated.mp4");
      await concatenateClips(processedClips, concatenatedPath, tempDir);
    }

    await updateProgress(projectId, 75);

    // Step 5: Add text overlays and final encoding (75-90%)
    console.log(`[VideoEditor] Adding overlays and final encoding...`);

    finalOutputPath = join(tempDir, "final.mp4");

    // Calculate total duration for overlay timing
    let totalDuration = 0;
    for (const clip of project.clips) {
      const trimEnd = clip.trimEnd ?? clip.sourceDuration;
      const effectiveDuration = (trimEnd - clip.trimStart) / clip.speed;
      totalDuration += effectiveDuration;
    }

    await addTextOverlays(
      concatenatedPath,
      finalOutputPath,
      project.overlays,
      totalDuration,
      outputSettings
    );

    await updateProgress(projectId, 90);

    // Step 6: Generate thumbnail
    console.log(`[VideoEditor] Generating thumbnail...`);

    thumbnailPath = join(tempDir, "thumbnail.jpg");
    await generateThumbnail(finalOutputPath, thumbnailPath);

    await updateProgress(projectId, 92);

    // Step 7: Upload final video and thumbnail (92-98%)
    console.log(`[VideoEditor] Uploading final video...`);

    const finalBuffer = await readFile(finalOutputPath);
    const thumbBuffer = await readFile(thumbnailPath);

    const timestamp = Date.now();
    const outputKey = `video-projects/${project.userId}/${projectId}/${timestamp}.mp4`;
    const thumbKey = `video-projects/${project.userId}/${projectId}/${timestamp}_thumb.jpg`;

    await uploadToMinio(outputKey, finalBuffer, "video/mp4");
    await uploadToMinio(thumbKey, thumbBuffer, "image/jpeg");

    await updateProgress(projectId, 98);

    // Step 8: Get final video metadata
    const finalMeta = await getVideoMetadata(finalOutputPath);

    // Step 9: Update project as completed
    await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        status: "completed",
        processingProgress: 100,
        outputUrl: getPublicUrl(outputKey),
        thumbnailUrl: getPublicUrl(thumbKey),
        currentDurationSeconds: finalMeta.duration,
      },
    });

    console.log(`[VideoEditor] Project ${projectId} completed successfully`);

  } finally {
    // Cleanup temp files
    const filesToClean = [
      ...downloadedFiles,
      ...processedClips,
      concatenatedPath,
      finalOutputPath,
      thumbnailPath,
    ].filter(Boolean);

    await Promise.all(
      filesToClean.map(f => unlink(f).catch(() => {}))
    );

    // Try to remove temp directory
    const { rmdir } = await import("fs/promises");
    await rmdir(tempDir).catch(() => {});
  }
}

/**
 * Safe wrapper for processing with error handling
 */
export async function processVideoProjectSafe(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await processVideoProject(projectId);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[VideoEditor] Project ${projectId} failed:`, message);

    await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        status: "failed",
        processingError: message,
      },
    });

    return { success: false, error: message };
  }
}

/**
 * Trigger video project processing (fire and forget)
 */
export function triggerVideoProjectProcessing(projectId: string): void {
  checkFfmpeg().then(async (ok) => {
    if (!ok) {
      console.error(`[VideoEditor] FFmpeg not available for project ${projectId}`);
      await prisma.videoProject.update({
        where: { id: projectId },
        data: {
          status: "failed",
          processingError: "FFmpeg not available on server",
        },
      });
      return;
    }

    processVideoProjectSafe(projectId).catch((e) =>
      console.error("[VideoEditor] Processing error:", e)
    );
  });
}
