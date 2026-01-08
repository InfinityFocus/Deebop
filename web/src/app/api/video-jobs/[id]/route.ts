import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/video-jobs/[id] - Get video job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.videoJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true,
        errorMessage: true,
        outputUrl: true,
        thumbnailUrl: true,
        durationSeconds: true,
        width: true,
        height: true,
        postId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        processedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Video job not found' }, { status: 404 });
    }

    // Only allow job owner to view status
    if (job.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error_message: job.errorMessage,
        output_url: job.outputUrl,
        thumbnail_url: job.thumbnailUrl,
        duration_seconds: job.durationSeconds,
        width: job.width,
        height: job.height,
        post_id: job.postId,
        created_at: job.createdAt.toISOString(),
        updated_at: job.updatedAt.toISOString(),
        processed_at: job.processedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get video job error:', error);
    return NextResponse.json({ error: 'Failed to fetch video job' }, { status: 500 });
  }
}

// DELETE /api/video-jobs/[id] - Cancel a pending/processing video job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.videoJob.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Video job not found' }, { status: 404 });
    }

    // Only allow job owner to cancel
    if (job.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Can only cancel pending or processing jobs
    if (!['pending', 'processing'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Can only cancel pending or processing jobs' },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    await prisma.videoJob.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel video job error:', error);
    return NextResponse.json({ error: 'Failed to cancel video job' }, { status: 500 });
  }
}
