import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth';
import { uploadToMinio } from '@/lib/minio';

// Size limits per tier (in KB)
const SIZE_LIMITS = {
  free: 500,      // 500KB - will compress to fit
  standard: 2000, // 2MB - light compression
  pro: 5000,      // 5MB - light compression
};

// Max dimensions for compression
const MAX_DIMENSIONS = {
  free: 1200,     // Cards display at ~400px, 1200px is plenty
  standard: 2000,
  pro: 2000,
};

/**
 * Compress image to fit within size limit
 * Progressively reduces quality and dimensions until under limit
 */
async function compressImage(
  buffer: Buffer,
  maxSizeKB: number,
  maxWidth: number
): Promise<{ buffer: Buffer; contentType: string }> {
  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const isWebp = metadata.format === 'webp';
  const isPng = metadata.format === 'png';

  let quality = 85;
  let width = Math.min(metadata.width || maxWidth, maxWidth);

  // Convert to JPEG for consistent compression (unless already small enough)
  let result = await sharp(buffer)
    .resize(width, null, { withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // Progressively reduce quality until under size limit
  while (result.length > maxSizeKB * 1024 && quality > 30) {
    quality -= 10;
    result = await sharp(buffer)
      .resize(width, null, { withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  // If still too large, reduce dimensions
  while (result.length > maxSizeKB * 1024 && width > 400) {
    width -= 200;
    result = await sharp(buffer)
      .resize(width, null, { withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return {
    buffer: result,
    contentType: 'image/jpeg',
  };
}

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Get tier-specific limits
    const tier = user.tier as 'free' | 'standard' | 'pro';
    const maxSizeKB = SIZE_LIMITS[tier];
    const maxWidth = MAX_DIMENSIONS[tier];

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress the image
    const { buffer: compressedBuffer, contentType } = await compressImage(
      buffer,
      maxSizeKB,
      maxWidth
    );

    // Check if compression succeeded
    if (compressedBuffer.length > maxSizeKB * 1024) {
      return NextResponse.json(
        { error: `Image could not be compressed below ${maxSizeKB}KB. Please try a smaller image.` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `creator-page/${user.id}/${timestamp}-${random}.jpg`;

    // Upload to MinIO
    const publicUrl = await uploadToMinio(key, compressedBuffer, contentType);

    return NextResponse.json({
      url: publicUrl,
      size: compressedBuffer.length,
      originalSize: buffer.length,
    });
  } catch (error) {
    console.error('Creator page upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
