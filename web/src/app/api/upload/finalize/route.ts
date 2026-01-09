import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPublicUrl } from '@/lib/minio';
import prisma from '@/lib/db';
import { triggerVideoProcessing } from '@/lib/video-job-processor';

// POST /api/upload/finalize - Finalize upload after direct upload to storage
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, mediaType, fileSize } = body;

    if (!key || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: key, mediaType' },
        { status: 400 }
      );
    }

    // For videos and audio, create processing job
    if (mediaType === 'video' || mediaType === 'audio') {
      const rawUrl = getPublicUrl(key);

      // Create VideoJob for async processing
      const job = await prisma.videoJob.create({
        data: {
          userId: user.id,
          userTier: user.tier,
          rawFileUrl: rawUrl,
          rawFileSize: fileSize || 0,
          mediaType,
          status: 'pending',
          progress: 0,
        },
      });

      console.log(`[Finalize] Created ${mediaType} job ${job.id} for user ${user.id}`);

      // Trigger processing in background
      triggerVideoProcessing(job.id);

      return NextResponse.json({
        jobId: job.id,
        status: 'processing',
        message: `${mediaType} upload received. Processing will begin shortly.`,
      });
    }

    // For images and panoramas, just return the public URL
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      url: publicUrl,
    });
  } catch (error) {
    console.error('Finalize upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to finalize upload', details: errorMessage },
      { status: 500 }
    );
  }
}
