import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import VideoEditorClient from './VideoEditorClient';

// Tier-based duration limits in seconds
const TIER_DURATION_LIMITS = {
  free: 60,
  standard: 180, // 3 minutes
  pro: 600, // 10 minutes
};

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        username: true,
        tier: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export default async function VideoEditorPage() {
  const user = await getUser();

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
