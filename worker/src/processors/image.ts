/**
 * Image Processing
 * - Free tier: Compress to max 500KB, resize to 1920px max
 * - Standard tier: Light optimization, 4096px max
 * - Pro tier: Minimal processing, preserve original
 */

import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || 'deebop-media';

interface ProcessImageOptions {
  tier: 'free' | 'standard' | 'pro';
  inputKey: string;
  outputKey: string;
}

interface ProcessImageResult {
  width: number;
  height: number;
  size: number;
  thumbnailKey: string;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function processImage(options: ProcessImageOptions): Promise<ProcessImageResult> {
  const { tier, inputKey, outputKey } = options;

  // Download original from S3
  const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: inputKey });
  const response = await s3.send(getCommand);
  const inputBuffer = await streamToBuffer(response.Body as Readable);

  // Get metadata
  const metadata = await sharp(inputBuffer).metadata();

  // Process based on tier
  let pipeline = sharp(inputBuffer);
  let quality = 90;

  if (tier === 'free') {
    // Compress aggressively for free tier
    pipeline = pipeline.resize(1920, 1920, { fit: 'inside', withoutEnlargement: true });
    quality = 70;
  } else if (tier === 'standard') {
    // Light optimization for standard tier
    pipeline = pipeline.resize(4096, 4096, { fit: 'inside', withoutEnlargement: true });
    quality = 85;
  }
  // Pro tier: minimal processing

  // Convert to JPEG with specified quality
  const processedBuffer = await pipeline
    .jpeg({ quality, progressive: true })
    .toBuffer();

  // Generate thumbnail (400x400)
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbnailKey = outputKey.replace(/\.[^.]+$/, '_thumb.jpg');

  // Upload processed image and thumbnail
  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: outputKey,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
    })),
    s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
    })),
  ]);

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: processedBuffer.length,
    thumbnailKey,
  };
}
