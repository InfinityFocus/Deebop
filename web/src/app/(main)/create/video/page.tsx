import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import VideoEditorClient from './VideoEditorClient';

// Tier-based duration limits in seconds
const TIER_DURATION_LIMITS = {
  free: 60,
  standard: 180, // 3 minutes
  pro: 600, // 10 minutes
};

export default async function VideoEditorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/create/video');
  }

  const maxDurationSeconds =
    TIER_DURATION_LIMITS[user.tier as keyof typeof TIER_DURATION_LIMITS] ||
    TIER_DURATION_LIMITS.free;

  return (
    <VideoEditorClient
      userId={user.id}
      userTier={user.tier}
      maxDurationSeconds={maxDurationSeconds}
    />
  );
}

export const metadata = {
  title: 'Video Studio | Deebop',
  description: 'Create and edit videos with filters, text overlays, and more',
};
