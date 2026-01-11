import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth';
import { uploadToMinio } from '@/lib/minio';

// Default max width for Creator Page images
const DEFAULT_MAX_WIDTH = 800;
const IMAGE_QUALITY = 85;

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
    const maxWidthParam = formData.get('maxWidth') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (PNG, JPG, WebP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG, JPG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Parse max width from param or use default
    const maxWidth = maxWidthParam ? parseInt(maxWidthParam, 10) : DEFAULT_MAX_WIDTH;
    const effectiveMaxWidth = maxWidth > 0 && maxWidth <= 2000 ? maxWidth : DEFAULT_MAX_WIDTH;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and compress image
    const metadata = await sharp(buffer).metadata();
    let processedBuffer: Buffer;

    if (metadata.width && metadata.width > effectiveMaxWidth) {
      processedBuffer = await sharp(buffer)
        .resize(effectiveMaxWidth, null, { withoutEnlargement: true })
        .jpeg({ quality: IMAGE_QUALITY })
        .toBuffer();
    } else {
      processedBuffer = await sharp(buffer)
        .jpeg({ quality: IMAGE_QUALITY })
        .toBuffer();
    }

    // Generate unique file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `creator-page/${user.id}/${timestamp}-${random}.jpg`;

    // Upload to MinIO
    const publicUrl = await uploadToMinio(key, processedBuffer, 'image/jpeg');

    return NextResponse.json({
      url: publicUrl,
    });
  } catch (error) {
    console.error('Creator page upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
