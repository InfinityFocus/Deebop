import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { uploadToMinio, generateFileKey } from '@/lib/minio';
import sharp from 'sharp';

const COVER_MAX_WIDTH = 750;
const IMAGE_QUALITY = 85;

// POST /api/users/me/cover - Upload cover image
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('cover') as File | null;

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

    // Convert to buffer and resize to max width
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    let processedBuffer: Buffer;
    if (metadata.width && metadata.width > COVER_MAX_WIDTH) {
      processedBuffer = await sharp(buffer)
        .resize(COVER_MAX_WIDTH, null, { withoutEnlargement: true })
        .jpeg({ quality: IMAGE_QUALITY })
        .toBuffer();
    } else {
      processedBuffer = await sharp(buffer)
        .jpeg({ quality: IMAGE_QUALITY })
        .toBuffer();
    }

    // Generate unique key and upload to MinIO
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const key = generateFileKey(user.id, 'covers', `${baseName}.jpg`);
    const coverImageUrl = await uploadToMinio(key, processedBuffer, 'image/jpeg');

    // Update user's cover image URL in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { coverImageUrl },
      select: {
        id: true,
        coverImageUrl: true,
      },
    });

    return NextResponse.json({
      cover_image_url: updatedUser.coverImageUrl,
    });
  } catch (error) {
    console.error('Cover image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 });
  }
}

// DELETE /api/users/me/cover - Remove cover image
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove cover image URL from database
    await prisma.user.update({
      where: { id: user.id },
      data: { coverImageUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cover image delete error:', error);
    return NextResponse.json({ error: 'Failed to remove cover image' }, { status: 500 });
  }
}
