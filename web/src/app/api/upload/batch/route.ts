import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateUploadUrl, generateFileKey, getPublicUrl } from '@/lib/minio';

// Tier-based file size limits (per image)
const IMAGE_LIMITS = {
  free: 500 * 1024, // 500KB
  standard: 10 * 1024 * 1024, // 10MB
  pro: 50 * 1024 * 1024, // 50MB
};

const MAX_CAROUSEL_IMAGES = 8;

interface FileInfo {
  filename: string;
  contentType: string;
  fileSize: number;
}

// POST /api/upload/batch - Get multiple presigned URLs for carousel uploads
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { files, mediaType } = body as { files: FileInfo[]; mediaType: string };

    // Validate request
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid files array' },
        { status: 400 }
      );
    }

    if (files.length > MAX_CAROUSEL_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CAROUSEL_IMAGES} images allowed per carousel` },
        { status: 400 }
      );
    }

    if (mediaType !== 'image') {
      return NextResponse.json(
        { error: 'Invalid mediaType. Must be "image"' },
        { status: 400 }
      );
    }

    // Get user's file size limit
    const maxSize = IMAGE_LIMITS[user.tier as keyof typeof IMAGE_LIMITS];

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.filename || !file.contentType) {
        return NextResponse.json(
          { error: `File ${i + 1}: Missing filename or contentType` },
          { status: 400 }
        );
      }

      if (!file.contentType.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${i + 1}: Must be an image` },
          { status: 400 }
        );
      }

      if (file.fileSize && file.fileSize > maxSize) {
        const maxMB = Math.round(maxSize / 1024 / 1024);
        return NextResponse.json(
          { error: `File ${i + 1}: Too large. Max size: ${maxMB}MB` },
          { status: 400 }
        );
      }
    }

    // Generate presigned URLs for all files
    const uploads = await Promise.all(
      files.map(async (file, index) => {
        const key = generateFileKey(user.id, 'image', file.filename);
        const uploadUrl = await generateUploadUrl({
          key,
          contentType: file.contentType,
          expiresIn: 3600, // 1 hour
        });

        return {
          index,
          uploadUrl,
          key,
          publicUrl: getPublicUrl(key),
        };
      })
    );

    return NextResponse.json({
      uploads,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Batch presigned URL error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate presigned URLs', details: errorMessage },
      { status: 500 }
    );
  }
}
