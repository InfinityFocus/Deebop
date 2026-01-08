import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Video metadata interface
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
}

// Tier limits interface
export interface TierLimits {
  maxDuration: number;
  maxWidth: number;
  maxHeight: number;
  audioBitrate: string;
}

// Tier-based video limits
export const TIER_VIDEO_LIMITS: Record<string, TierLimits> = {
  free: {
    maxDuration: 30,
    maxWidth: 1280,
    maxHeight: 720,
    audioBitrate: '128k',
  },
  standard: {
    maxDuration: 60,
    maxWidth: 1920,
    maxHeight: 1080,
    audioBitrate: '192k',
  },
  pro: {
    maxDuration: 300,
    maxWidth: 3840,
    maxHeight: 2160,
    audioBitrate: '256k',
  },
};

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  needsTranscode: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const duration = metadata.format.duration || 0;
      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const codec = videoStream.codec_name || 'unknown';
      const bitrate = metadata.format.bit_rate ? Number(metadata.format.bit_rate) : 0;

      // Parse fps from r_frame_rate (e.g., "30/1" or "30000/1001")
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2) {
          fps = parseInt(parts[0]) / parseInt(parts[1]);
        }
      }

      resolve({
        duration,
        width,
        height,
        codec,
        bitrate,
        fps,
      });
    });
  });
}

/**
 * Validate video against tier limits
 */
export function validateForTier(metadata: VideoMetadata, tier: string): ValidationResult {
  const limits = TIER_VIDEO_LIMITS[tier] || TIER_VIDEO_LIMITS.free;
  const errors: string[] = [];
  let needsTranscode = false;
  let targetWidth: number | undefined;
  let targetHeight: number | undefined;

  // Check duration (hard limit - cannot transcode to shorter)
  if (metadata.duration > limits.maxDuration) {
    errors.push(
      `Video duration (${Math.round(metadata.duration)}s) exceeds ${tier} tier limit of ${limits.maxDuration}s`
    );
  }

  // Check resolution (can transcode down)
  if (metadata.width > limits.maxWidth || metadata.height > limits.maxHeight) {
    needsTranscode = true;

    // Calculate target resolution maintaining aspect ratio
    const aspectRatio = metadata.width / metadata.height;

    if (aspectRatio > limits.maxWidth / limits.maxHeight) {
      // Width is the limiting factor
      targetWidth = limits.maxWidth;
      targetHeight = Math.round(limits.maxWidth / aspectRatio);
      // Ensure even dimensions for video encoding
      targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;
    } else {
      // Height is the limiting factor
      targetHeight = limits.maxHeight;
      targetWidth = Math.round(limits.maxHeight * aspectRatio);
      // Ensure even dimensions for video encoding
      targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    needsTranscode,
    targetWidth,
    targetHeight,
  };
}

/**
 * Transcode video to target resolution
 */
export async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number,
  audioBitrate: string = '128k',
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(audioBitrate)
      .videoFilters([
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
        `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`,
      ])
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart', // Enable fast start for web playback
      ])
      .output(outputPath);

    if (onProgress) {
      command.on('progress', (progress) => {
        if (progress.percent) {
          onProgress(Math.round(progress.percent));
        }
      });
    }

    command
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Transcoding failed: ${err.message}`)))
      .run();
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp: number = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '640x?', // 640px width, maintain aspect ratio
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Thumbnail generation failed: ${err.message}`)));
  });
}

/**
 * Create a temporary directory for video processing
 */
export function createTempDir(): string {
  const tempDir = path.join(os.tmpdir(), `video-processing-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up temporary files
 */
export function cleanupTempDir(tempDir: string): void {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Failed to cleanup temp dir:', error);
  }
}

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err);
    });
  });
}

/**
 * Get resolution string for display
 */
export function getResolutionString(width: number, height: number): string {
  if (height >= 2160) return '4K';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return `${height}p`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
