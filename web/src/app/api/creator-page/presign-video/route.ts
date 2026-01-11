import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateUploadUrl, getPublicUrl } from '@/lib/minio';

// Max video size: 50MB for Creator Page intro videos
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// Allowed video types
const ALLOWED_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Creator Page requires Standard or Pro tier
    if (user.tier === 'free') {
      return NextResponse.json(
        { error: 'Creator Page requires Standard or Pro subscription' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contentType, fileSize, filename } = body;

    // Validate content type
    if (!contentType || !ALLOWED_TYPES[contentType]) {
      return NextResponse.json(
        { error: 'Only MP4, WebM, and MOV videos are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (!fileSize || fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video must be under ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const ext = ALLOWED_TYPES[contentType];
    const key = `creator-page/${user.id}/videos/${timestamp}-${random}.${ext}`;

    // Generate presigned URL (valid for 10 minutes)
    const uploadUrl = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 600,
    });

    // Get the public URL for after upload completes
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error('Presign video error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
