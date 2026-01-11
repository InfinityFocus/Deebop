import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth';
import { uploadToMinio } from '@/lib/minio';

// Creator Page images are resized to max viewable width (cards display at ~400px, 800px is plenty)
const IMAGE_MAX_WIDTH = 800;
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize and compress image
    const metadata = await sharp(buffer).metadata();
    let processedBuffer: Buffer;

    if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
      processedBuffer = await sharp(buffer)
        .resize(IMAGE_MAX_WIDTH, null, { withoutEnlargement: true })
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
