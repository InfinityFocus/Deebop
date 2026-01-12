import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/video-projects/[id] - Get single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching video project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/video-projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, clips, overlays } = body;

    // Verify ownership
    const existingProject = await prisma.videoProject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate current duration
    let currentDuration = 0;
    if (clips && clips.length > 0) {
      currentDuration = clips.reduce(
        (
          sum: number,
          clip: { trimStart: number; trimEnd?: number | null; sourceDuration: number; speed: number }
        ) => {
          const trimEnd = clip.trimEnd ?? clip.sourceDuration;
          const effectiveDuration = (trimEnd - clip.trimStart) / clip.speed;
          return sum + effectiveDuration;
        },
        0
      );
    }

    // Update project in a transaction
    const project = await prisma.$transaction(async (tx) => {
      // Delete existing clips and overlays
      await tx.videoClip.deleteMany({ where: { projectId: id } });
      await tx.videoOverlay.deleteMany({ where: { projectId: id } });

      // Update project with new clips and overlays
      return tx.videoProject.update({
        where: { id },
        data: {
          name: name,
          currentDurationSeconds: currentDuration,
          clips: clips
            ? {
                create: clips.map(
                  (
                    clip: {
                      sourceUrl: string;
                      sourceDuration: number;
                      sourceWidth?: number;
                      sourceHeight?: number;
                      sortOrder: number;
                      trimStart: number;
                      trimEnd?: number | null;
                      speed: number;
                      filterPreset?: string | null;
                      volume: number;
                    },
                    index: number
                  ) => ({
                    sourceUrl: clip.sourceUrl,
                    sourceDuration: clip.sourceDuration,
                    sourceWidth: clip.sourceWidth,
                    sourceHeight: clip.sourceHeight,
                    sortOrder: clip.sortOrder ?? index,
                    trimStart: clip.trimStart ?? 0,
                    trimEnd: clip.trimEnd,
                    speed: clip.speed ?? 1,
                    filterPreset: clip.filterPreset,
                    volume: clip.volume ?? 1,
                  })
                ),
              }
            : undefined,
          overlays: overlays
            ? {
                create: overlays.map(
                  (overlay: {
                    type: 'text' | 'image';
                    positionX: number;
                    positionY: number;
                    startTime: number;
                    endTime?: number | null;
                    text?: string;
                    fontFamily?: string;
                    fontSize?: number;
                    fontColor?: string;
                    backgroundColor?: string | null;
                  }) => ({
                    type: overlay.type || 'text',
                    positionX: overlay.positionX ?? 50,
                    positionY: overlay.positionY ?? 50,
                    startTime: overlay.startTime ?? 0,
                    endTime: overlay.endTime,
                    text: overlay.text,
                    fontFamily: overlay.fontFamily || 'sans-serif',
                    fontSize: overlay.fontSize || 32,
                    fontColor: overlay.fontColor || '#FFFFFF',
                    backgroundColor: overlay.backgroundColor,
                  })
                ),
              }
            : undefined,
        },
        include: {
          clips: {
            orderBy: { sortOrder: 'asc' },
          },
          overlays: true,
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating video project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/video-projects/[id] - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingProject = await prisma.videoProject.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete project (cascades to clips and overlays)
    await prisma.videoProject.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
