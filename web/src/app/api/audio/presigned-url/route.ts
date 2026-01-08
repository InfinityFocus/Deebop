import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateFileKey } from '@/lib/minio';

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || 'minioadmin123';
const S3_BUCKET = process.env.S3_BUCKET || 'deebop-media';

// Tier-based file size limits for audio
const AUDIO_FILE_LIMITS = {
  free: 10 * 1024 * 1024, // 10MB
  standard: 50 * 1024 * 1024, // 50MB
  pro: 200 * 1024 * 1024, // 200MB
};

// Create S3 client
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

/**
 * POST /api/audio/presigned-url
 * Generate a presigned URL for direct audio upload to S3/MinIO
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, fileSize' },
        { status: 400 }
      );
    }

    // Validate content type is audio
    if (!contentType.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid content type. Must be audio/*' },
        { status: 400 }
      );
    }

    // Check file size limit
    const maxSize = AUDIO_FILE_LIMITS[user.tier as keyof typeof AUDIO_FILE_LIMITS];
    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Max size for ${user.tier} tier: ${maxMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique key for the upload
    const key = generateFileKey(user.id, 'raw/audio', filename);

    // Generate presigned URL (valid for 15 minutes)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // Construct the final URL for accessing the file after upload
    const fileUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

    return NextResponse.json({
      presignedUrl,
      fileUrl,
      key,
      expiresIn: 900, // 15 minutes
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
