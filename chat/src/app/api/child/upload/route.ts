import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadVoiceMessage } from '@/lib/storage';

// Max voice message duration (30 seconds)
const MAX_DURATION_SECONDS = 30;

// Max file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'child') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const durationStr = formData.get('duration') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = durationStr ? parseFloat(durationStr) : 0;
    if (duration > MAX_DURATION_SECONDS) {
      return NextResponse.json(
        { success: false, error: `Voice message too long. Maximum duration is ${MAX_DURATION_SECONDS} seconds.` },
        { status: 400 }
      );
    }

    // Strip codec suffix from content type (e.g., 'audio/webm;codecs=opus' -> 'audio/webm')
    // Supabase storage doesn't accept MIME types with codec parameters
    const contentType = file.type.split(';')[0];

    // Upload to storage
    const { key, url } = await uploadVoiceMessage(
      user.id,
      file,
      contentType
    );

    return NextResponse.json({
      success: true,
      data: {
        key,
        url,
        duration,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload voice message' },
      { status: 500 }
    );
  }
}
