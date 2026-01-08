import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import { uploadToMinio } from '@/lib/minio';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) return null;
    return user;
  } catch {
    return null;
  }
}

// POST /api/admin/blog/upload - Upload image for blog
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }

    // Max 10MB for blog images
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `blog/${admin.id}/${timestamp}-${random}.${ext}`;

    // Upload to MinIO using AWS SDK
    const arrayBuffer = await file.arrayBuffer();
    const publicUrl = await uploadToMinio(key, arrayBuffer, file.type);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Blog upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
