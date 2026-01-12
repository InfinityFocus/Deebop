import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import VideoEditorClient from '../VideoEditorClient';

// Tier-based duration limits in seconds
const TIER_DURATION_LIMITS = {
  free: 60,
  standard: 180, // 3 minutes
  pro: 600, // 10 minutes
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVideoProjectPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    const { id } = await params;
    redirect(`/login?redirect=/create/video/${id}`);
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
    notFound();
  }

  // Check ownership
  if (project.userId !== user.id) {
    notFound();
  }

  const maxDurationSeconds =
    TIER_DURATION_LIMITS[user.tier as keyof typeof TIER_DURATION_LIMITS] ||
    TIER_DURATION_LIMITS.free;

  // Transform database data to match store types
  const initialProject = {
    id: project.id,
    name: project.name,
    status: project.status as 'draft' | 'processing' | 'completed' | 'failed',
    maxDurationSeconds: project.maxDurationSeconds,
    clips: project.clips.map((clip) => ({
      id: clip.id,
      sourceUrl: clip.sourceUrl,
      sourceDuration: clip.sourceDuration,
      sourceWidth: clip.sourceWidth ?? undefined,
      sourceHeight: clip.sourceHeight ?? undefined,
      sortOrder: clip.sortOrder,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd,
      speed: clip.speed,
      filterPreset: clip.filterPreset,
      volume: clip.volume,
    })),
    overlays: project.overlays.map((overlay) => ({
      id: overlay.id,
      type: overlay.type as 'text' | 'image',
      positionX: overlay.positionX,
      positionY: overlay.positionY,
      startTime: overlay.startTime,
      endTime: overlay.endTime,
      text: overlay.text ?? '',
      fontFamily: overlay.fontFamily,
      fontSize: overlay.fontSize,
      fontColor: overlay.fontColor,
      backgroundColor: overlay.backgroundColor,
    })),
  };

  return (
    <VideoEditorClient
      userId={user.id}
      userTier={user.tier}
      maxDurationSeconds={maxDurationSeconds}
      initialProject={initialProject}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  const project = await prisma.videoProject.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: project ? `${project.name} | Video Studio` : 'Video Studio | Deebop',
    description: 'Edit your video project with filters, text overlays, and more',
  };
}
