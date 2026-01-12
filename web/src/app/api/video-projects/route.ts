import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Tier-based duration limits in seconds
const TIER_DURATION_LIMITS = {
  free: 60,
  standard: 180,
  pro: 600,
};

// GET /api/video-projects - List user's projects
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.videoProject.findMany({
      where: { userId: user.id },
      include: {
        clips: {
          orderBy: { sortOrder: 'asc' },
        },
        overlays: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching video projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/video-projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, maxDurationSeconds, clips, overlays } = body;

    // Validate tier limits
    const tierLimit =
      TIER_DURATION_LIMITS[user.tier as keyof typeof TIER_DURATION_LIMITS] ||
      TIER_DURATION_LIMITS.free;

    if (maxDurationSeconds > tierLimit) {
      return NextResponse.json(
        { error: `Max duration for ${user.tier} tier is ${tierLimit} seconds` },
        { status: 400 }
      );
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

    // Create project with clips and overlays
    const project = await prisma.videoProject.create({
      data: {
        userId: user.id,
        name: name || 'Untitled Project',
        maxDurationSeconds: maxDurationSeconds || tierLimit,
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating video project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
