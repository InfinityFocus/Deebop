import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateUploadUrl, generateFileKey, getPublicUrl } from '@/lib/minio';

// Tier-based file size limits (must match tiers in stripe.ts: free, creator, pro, teams)
const FILE_LIMITS = {
  free: {
    image: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024, // 500MB
    audio: 50 * 1024 * 1024, // 50MB
    panorama360: 0, // Not allowed
  },
  creator: {
    image: 50 * 1024 * 1024, // 50MB
    video: 2 * 1024 * 1024 * 1024, // 2GB
    audio: 100 * 1024 * 1024, // 100MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
  pro: {
    image: 50 * 1024 * 1024, // 50MB
    video: 5 * 1024 * 1024 * 1024, // 5GB
    audio: 200 * 1024 * 1024, // 200MB
    panorama360: 100 * 1024 * 1024, // 100MB
  },
  teams: {
    image: 50 * 1024 * 1024, // 50MB
    video: 5 * 1024 * 1024 * 1024, // 5GB
    audio: 500 * 1024 * 1024, // 500MB
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

    // Check panorama permission (creator, pro, and teams can upload panoramas)
    const panoramaTiers = ['creator', 'pro', 'teams'];
    if (mediaType === 'panorama360' && !panoramaTiers.includes(user.tier || '')) {
      return NextResponse.json(
        { error: '360 panoramas require Creator tier or higher' },
        { status: 403 }
      );
    }

    // Check file size limit (fallback to 'free' if tier is undefined or invalid)
    const userTier = (user.tier && user.tier in FILE_LIMITS) ? user.tier as keyof typeof FILE_LIMITS : 'free';
    const limits = FILE_LIMITS[userTier];
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
