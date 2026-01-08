import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { uploadToMinio, generateFileKey } from '@/lib/minio';

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for cover images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Generate unique key and upload to MinIO
    const key = generateFileKey(user.id, 'covers', file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const coverImageUrl = await uploadToMinio(key, buffer, file.type);

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
