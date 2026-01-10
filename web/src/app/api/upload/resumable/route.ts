import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateFileKey } from '@/lib/minio';

// Tier-based file size limits
const FILE_LIMITS = {
  free: {
    video: 10 * 1024 * 1024, // 10MB
    audio: 10 * 1024 * 1024, // 10MB
  },
  standard: {
    video: 50 * 1024 * 1024, // 50MB
    audio: 50 * 1024 * 1024, // 50MB
  },
  pro: {
    video: 500 * 1024 * 1024, // 500MB
    audio: 200 * 1024 * 1024, // 200MB
  },
};

// Get Supabase config from S3 endpoint
function getSupabaseConfig() {
  const s3Endpoint = process.env.S3_ENDPOINT || '';
  const bucket = process.env.S3_BUCKET || 'deebop-media';

  // Extract project ID from S3 endpoint
  // Format: https://[project_id].supabase.co/storage/v1/s3
  const match = s3Endpoint.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectId = match ? match[1] : null;

  if (!projectId) {
    throw new Error('Could not extract Supabase project ID from S3_ENDPOINT');
  }

  return {
    projectId,
    bucket,
    // TUS endpoint for resumable uploads
    tusEndpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
    // S3 secret key can be used as auth token for storage operations
    authToken: process.env.S3_SECRET_ACCESS_KEY,
  };
}

// POST /api/upload/resumable - Get TUS upload configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, mediaType, fileSize } = body;

    if (!filename || !contentType || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, mediaType' },
        { status: 400 }
      );
    }

    // Only allow video and audio for resumable uploads
    if (!['video', 'audio'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'Resumable uploads only supported for video and audio' },
        { status: 400 }
      );
    }

    // Check file size limit
    const limits = FILE_LIMITS[user.tier as keyof typeof FILE_LIMITS] || FILE_LIMITS.free;
    const maxSize = limits[mediaType as keyof typeof limits];

    if (fileSize && fileSize > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Max size for ${mediaType}: ${maxMB}MB` },
        { status: 400 }
      );
    }

    // Generate file key
    const key = generateFileKey(user.id, 'raw', filename);

    // Get Supabase configuration
    const config = getSupabaseConfig();

    // Return TUS upload configuration
    return NextResponse.json({
      tusEndpoint: config.tusEndpoint,
      authToken: config.authToken,
      bucket: config.bucket,
      key,
      fileSize,
      contentType,
      mediaType,
    });
  } catch (error) {
    console.error('Resumable upload config error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get upload configuration', details: errorMessage },
      { status: 500 }
    );
  }
}
