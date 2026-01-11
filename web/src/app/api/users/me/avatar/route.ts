import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { uploadToMinio, generateFileKey } from '@/lib/minio';
import sharp from 'sharp';

const AVATAR_MAX_SIZE = 200;
const IMAGE_QUALITY = 85;

// POST /api/users/me/avatar - Upload avatar
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

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

    // Convert to buffer and resize to 200x200
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await sharp(buffer)
      .resize(AVATAR_MAX_SIZE, AVATAR_MAX_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: IMAGE_QUALITY })
      .toBuffer();

    // Generate unique key and upload to MinIO
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const key = generateFileKey(user.id, 'avatars', `${baseName}.jpg`);
    const avatarUrl = await uploadToMinio(key, processedBuffer, 'image/jpeg');

    // Update user's avatar URL in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      avatar_url: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

// DELETE /api/users/me/avatar - Remove avatar
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove avatar URL from database (don't delete from S3 for now)
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
