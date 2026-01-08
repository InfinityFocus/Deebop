/**
 * 360 Panorama Processing
 * - Validates equirectangular format (2:1 aspect ratio)
 * - Generates thumbnail
 * - Pro tier only
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
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'deebop-media';

interface ProcessPanoramaOptions {
  tier: 'free' | 'standard' | 'pro';
  inputKey: string;
  outputKey: string;
}

interface ProcessPanoramaResult {
  width: number;
  height: number;
  size: number;
  thumbnailKey: string;
  isValidEquirectangular: boolean;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function processPanorama(options: ProcessPanoramaOptions): Promise<ProcessPanoramaResult> {
  const { tier, inputKey, outputKey } = options;

  // Only Pro tier can upload panoramas
  if (tier !== 'pro') {
    throw new Error('360 panorama uploads require Pro subscription');
  }

  // Download original from S3
  const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: inputKey });
  const response = await s3.send(getCommand);
  const inputBuffer = await streamToBuffer(response.Body as Readable);

  // Get metadata
  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Validate equirectangular format (should be 2:1 aspect ratio)
  const aspectRatio = width / height;
  const isValidEquirectangular = aspectRatio >= 1.9 && aspectRatio <= 2.1;

  if (!isValidEquirectangular) {
    console.warn(`Panorama aspect ratio ${aspectRatio.toFixed(2)} is not standard 2:1`);
  }

  // Optimize the panorama (light compression to preserve quality)
  const processedBuffer = await sharp(inputBuffer)
    .resize(8192, 4096, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  // Generate flat thumbnail (center crop)
  const thumbnailBuffer = await sharp(inputBuffer)
    .resize(800, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toBuffer();

  const thumbnailKey = outputKey.replace(/\.[^.]+$/, '_thumb.jpg');

  // Upload processed panorama and thumbnail
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
    width,
    height,
    size: processedBuffer.length,
    thumbnailKey,
    isValidEquirectangular,
  };
}
