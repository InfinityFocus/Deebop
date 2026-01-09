/**
 * MinIO/S3 utilities for file uploads
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || 'minioadmin123';
const S3_BUCKET = process.env.S3_BUCKET || 'deebop-media';

// Detect if we're using Supabase Storage (for public URL generation)
const isSupabase = S3_ENDPOINT.includes('supabase.co');
const SUPABASE_PROJECT_URL = isSupabase
  ? S3_ENDPOINT.replace('/storage/v1/s3', '')
  : null;

// Create S3 client configured for MinIO/Supabase
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: isSupabase ? 'eu-west-1' : 'us-east-1', // Supabase uses actual region
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO and Supabase S3
});

interface PresignedUrlOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds
}

/**
 * Generate a presigned URL for uploading directly to MinIO/Supabase
 * This allows clients to upload large files directly without going through serverless functions
 */
export async function generateUploadUrl(options: PresignedUrlOptions): Promise<string> {
  const { key, contentType, expiresIn = 3600 } = options;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Get the public URL for a file in MinIO/Supabase
 */
export function getPublicUrl(key: string): string {
  if (isSupabase && SUPABASE_PROJECT_URL) {
    // Supabase public URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[key]
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${S3_BUCKET}/${key}`;
  }
  // MinIO format
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

/**
 * Generate a unique key for a file upload
 */
export function generateFileKey(userId: string, contentType: string, filename: string): string {
  const timestamp = Date.now();
  const ext = filename.split('.').pop() || 'bin';
  return `${contentType}/${userId}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;
}

/**
 * Get MinIO credentials for direct upload
 */
export function getUploadCredentials() {
  return {
    endpoint: S3_ENDPOINT,
    bucket: S3_BUCKET,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
  };
}

/**
 * Upload a file to MinIO/Supabase from the server side
 * Uses AWS SDK with proper AWS4-HMAC-SHA256 signing
 */
export async function uploadToMinio(
  key: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body instanceof ArrayBuffer ? Buffer.from(body) : body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return getPublicUrl(key);
  } catch (error) {
    console.error('S3 Upload Error:', {
      error,
      endpoint: S3_ENDPOINT,
      bucket: S3_BUCKET,
      key,
      isSupabase,
    });
    throw error;
  }
}

/**
 * Download a file from MinIO
 */
export async function downloadFromMinio(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('Empty response body');
  }

  // Convert stream to buffer
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Delete a file from MinIO
 */
export async function deleteFromMinio(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Extract the key from a full MinIO/Supabase URL
 */
export function extractKeyFromUrl(url: string): string {
  // Handle Supabase URLs
  if (isSupabase && SUPABASE_PROJECT_URL) {
    const supabasePrefix = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${S3_BUCKET}/`;
    if (url.startsWith(supabasePrefix)) {
      return url.slice(supabasePrefix.length);
    }
  }
  // Handle MinIO URLs
  const bucketPrefix = `${S3_ENDPOINT}/${S3_BUCKET}/`;
  if (url.startsWith(bucketPrefix)) {
    return url.slice(bucketPrefix.length);
  }
  return url;
}
