import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerVideoProjectProcessing } from '@/lib/video-editor-processor';

// POST /api/video-projects/[id]/process - Start processing
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch project with clips and overlays
    const project = await prisma.videoProject.findUnique({
      where: { id },
      include: {
        clips: {
          orderBy: { sortOrder: 'asc' },
        },
        overlays: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check ownership
    if (project.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check project status
    if (project.status === 'processing') {
      return NextResponse.json(
        { error: 'Project is already being processed' },
        { status: 400 }
      );
    }

    // Check if there are clips
    if (project.clips.length === 0) {
      return NextResponse.json(
        { error: 'Project has no clips to process' },
        { status: 400 }
      );
    }

    // Check duration limit
    if (
      project.currentDurationSeconds &&
      project.currentDurationSeconds > project.maxDurationSeconds
    ) {
      return NextResponse.json(
        {
          error: `Video duration (${Math.round(project.currentDurationSeconds)}s) exceeds tier limit (${project.maxDurationSeconds}s)`,
        },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.videoProject.update({
      where: { id },
      data: {
        status: 'processing',
        processingProgress: 0,
        processingError: null,
      },
    });

    // Start processing in background
    // In production, this would be a job queue (e.g., BullMQ)
    // For now, we'll start the process and return immediately
    // The client can poll the project status for progress updates

    // Trigger background processing (fire and forget)
    triggerVideoProjectProcessing(id);

    return NextResponse.json({
      message: 'Processing started',
      projectId: id,
      status: 'processing',
    });
  } catch (error) {
    console.error('Error starting video processing:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}
