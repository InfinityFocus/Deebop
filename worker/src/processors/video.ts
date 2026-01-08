/**
 * Video Processing with FFmpeg
 * - Free tier: 720p, 30 seconds max, 1.5Mbps
 * - Standard tier: 1080p, 1 minute max, 4Mbps
 * - Pro tier: 4K, 5 minutes max, 12Mbps
 */

import ffmpeg from 'fluent-ffmpeg';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { createWriteStream, createReadStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import os from 'os';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'deebop-media';

interface ProcessVideoOptions {
  tier: 'free' | 'standard' | 'pro';
  inputKey: string;
  outputKey: string;
}

interface ProcessVideoResult {
  width: number;
  height: number;
  duration: number;
  size: number;
  thumbnailKey: string;
}

const TIER_SETTINGS = {
  free: {
    maxDuration: 30,
    scale: 'scale=-2:720',
    videoBitrate: '1500k',
    audioBitrate: '128k',
  },
  standard: {
    maxDuration: 60,
    scale: 'scale=-2:1080',
    videoBitrate: '4000k',
    audioBitrate: '192k',
  },
  pro: {
    maxDuration: 300,
    scale: null, // No scaling for 4K
    videoBitrate: '12000k',
    audioBitrate: '256k',
  },
};

function getVideoMetadata(inputPath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

export async function processVideo(options: ProcessVideoOptions): Promise<ProcessVideoResult> {
  const { tier, inputKey, outputKey } = options;
  const settings = TIER_SETTINGS[tier];

  // Create temp files
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const tempInput = path.join(tempDir, `input_${timestamp}.mp4`);
  const tempOutput = path.join(tempDir, `output_${timestamp}.mp4`);
  const tempThumb = path.join(tempDir, `thumb_${timestamp}.jpg`);

  try {
    // Download from S3
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: inputKey });
    const response = await s3.send(getCommand);
    await pipeline(response.Body as Readable, createWriteStream(tempInput));

    // Get video metadata
    const metadata = await getVideoMetadata(tempInput);
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const duration = metadata.format.duration || 0;

    if (duration > settings.maxDuration) {
      throw new Error(`Video exceeds ${settings.maxDuration}s limit for ${tier} tier`);
    }

    // Transcode video
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(tempInput)
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          `-b:v ${settings.videoBitrate}`,
          '-c:a aac',
          `-b:a ${settings.audioBitrate}`,
          '-movflags +faststart',
          '-pix_fmt yuv420p',
        ]);

      if (settings.scale) {
        command = command.outputOptions([`-vf ${settings.scale}`]);
      }

      command
        .output(tempOutput)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    // Generate thumbnail at 1 second
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInput)
        .screenshots({
          timestamps: ['1'],
          filename: path.basename(tempThumb),
          folder: tempDir,
          size: '640x360',
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    // Get output file stats
    const outputStats = await fs.stat(tempOutput);
    const thumbnailKey = outputKey.replace('.mp4', '_thumb.jpg');

    // Upload to S3
    await Promise.all([
      s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: outputKey,
        Body: createReadStream(tempOutput),
        ContentType: 'video/mp4',
      })),
      s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbnailKey,
        Body: createReadStream(tempThumb),
        ContentType: 'image/jpeg',
      })),
    ]);

    return {
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      duration: Math.round(duration),
      size: outputStats.size,
      thumbnailKey,
    };
  } finally {
    // Cleanup temp files
    await Promise.all([
      fs.unlink(tempInput).catch(() => {}),
      fs.unlink(tempOutput).catch(() => {}),
      fs.unlink(tempThumb).catch(() => {}),
    ]);
  }
}
