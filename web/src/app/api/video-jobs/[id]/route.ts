import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  isBunnyStreamEnabled,
  getBunnyVideoStatus,
  getBunnyStatusLabel,
  isVideoReady,
  getBunnyPlaybackUrl,
  getBunnyThumbnailUrl,
} from '@/lib/bunny-stream';

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
        rawFileUrl: true,
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

    // Check if this is a Bunny Stream video
    const isBunnyVideo = job.rawFileUrl?.startsWith('bunny:');

    if (isBunnyVideo && isBunnyStreamEnabled() && job.status === 'processing') {
      // Poll Bunny Stream for actual status
      const bunnyGuid = job.rawFileUrl!.replace('bunny:', '');

      try {
        const bunnyStatus = await getBunnyVideoStatus(bunnyGuid);
        const statusLabel = getBunnyStatusLabel(bunnyStatus.status);
        const ready = isVideoReady(bunnyStatus.status);

        // Update job if processing is complete
        if (ready && job.status !== 'completed') {
          await prisma.videoJob.update({
            where: { id },
            data: {
              status: 'completed',
              progress: 100,
              processedAt: new Date(),
              durationSeconds: Math.round(bunnyStatus.length),
              width: bunnyStatus.width,
              height: bunnyStatus.height,
              outputUrl: getBunnyPlaybackUrl(bunnyGuid),
              thumbnailUrl: getBunnyThumbnailUrl(bunnyGuid),
            },
          });

          return NextResponse.json({
            job: {
              id: job.id,
              status: 'completed',
              progress: 100,
              error_message: null,
              output_url: getBunnyPlaybackUrl(bunnyGuid),
              thumbnail_url: getBunnyThumbnailUrl(bunnyGuid),
              duration_seconds: Math.round(bunnyStatus.length),
              width: bunnyStatus.width,
              height: bunnyStatus.height,
              post_id: job.postId,
              bunny_guid: bunnyGuid,
              created_at: job.createdAt.toISOString(),
              updated_at: new Date().toISOString(),
              processed_at: new Date().toISOString(),
            },
          });
        }

        // Update progress based on Bunny's encode progress
        if (bunnyStatus.status === 5) {
          // Error status
          await prisma.videoJob.update({
            where: { id },
            data: {
              status: 'failed',
              errorMessage: 'Bunny Stream transcoding failed',
            },
          });

          return NextResponse.json({
            job: {
              id: job.id,
              status: 'failed',
              progress: 0,
              error_message: 'Video transcoding failed',
              output_url: null,
              thumbnail_url: null,
              bunny_guid: bunnyGuid,
              created_at: job.createdAt.toISOString(),
              updated_at: new Date().toISOString(),
              processed_at: null,
            },
          });
        }

        // Still processing
        return NextResponse.json({
          job: {
            id: job.id,
            status: 'processing',
            progress: bunnyStatus.encodeProgress || 0,
            error_message: null,
            output_url: job.outputUrl,
            thumbnail_url: job.thumbnailUrl,
            duration_seconds: null,
            width: null,
            height: null,
            post_id: job.postId,
            bunny_guid: bunnyGuid,
            bunny_status: statusLabel,
            created_at: job.createdAt.toISOString(),
            updated_at: job.updatedAt.toISOString(),
            processed_at: null,
          },
        });
      } catch (bunnyError) {
        console.error('Error checking Bunny status:', bunnyError);
        // Return cached job status if Bunny check fails
      }
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
        bunny_guid: isBunnyVideo ? job.rawFileUrl?.replace('bunny:', '') : null,
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
