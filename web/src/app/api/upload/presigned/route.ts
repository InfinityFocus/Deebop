import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateUploadUrl, generateFileKey, getPublicUrl } from '@/lib/minio';

// Tier-based file size limits
const FILE_LIMITS = {
  free: {
    image: 500 * 1024, // 500KB
    video: 10 * 1024 * 1024, // 10MB
    audio: 10 * 1024 * 1024, // 10MB
    panorama360: 0, // Not allowed
  },
  standard: {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 50 * 1024 * 1024, // 50MB
    panorama360: 0, // Not allowed
  },
  pro: {
    image: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024, // 500MB
    audio: 200 * 1024 * 1024, // 200MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
};

// POST /api/upload/presigned - Get presigned URL for direct upload
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

    // Check if media type is allowed
    if (!['image', 'video', 'audio', 'panorama360'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Check panorama permission
    if (mediaType === 'panorama360' && user.tier !== 'pro') {
      return NextResponse.json(
        { error: '360 panoramas require Pro tier' },
        { status: 403 }
      );
    }

    // Check file size limit
    const limits = FILE_LIMITS[user.tier as keyof typeof FILE_LIMITS];
    const maxSize = limits[mediaType as keyof typeof limits];

    if (maxSize === 0) {
      return NextResponse.json(
        { error: `${mediaType} uploads are not available for your tier` },
        { status: 403 }
      );
    }

    if (fileSize && fileSize > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Max size for ${mediaType}: ${maxMB}MB` },
        { status: 400 }
      );
    }

    // Generate file key
    const prefix = mediaType === 'video' || mediaType === 'audio' ? 'raw' : mediaType;
    const key = generateFileKey(user.id, prefix, filename);

    // Generate presigned URL for upload
    const uploadUrl = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    // Return presigned URL and file info
    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: getPublicUrl(key),
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: errorMessage },
      { status: 500 }
    );
  }
}
