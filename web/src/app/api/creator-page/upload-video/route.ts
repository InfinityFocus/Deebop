import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadToMinio } from '@/lib/minio';

// Max video size: 50MB for Creator Page intro videos
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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

    // Validate file type (MP4, WebM, MOV)
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only MP4, WebM, and MOV videos are allowed' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video must be under ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    };
    const ext = extMap[file.type] || 'mp4';

    // Generate unique file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `creator-page/${user.id}/videos/${timestamp}-${random}.${ext}`;

    // Upload to MinIO
    const publicUrl = await uploadToMinio(key, buffer, file.type);

    return NextResponse.json({
      url: publicUrl,
    });
  } catch (error) {
    console.error('Creator page video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
