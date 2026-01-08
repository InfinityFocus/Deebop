import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { CreatorPageRenderer } from '@/components/creator-page/CreatorPageRenderer';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function CreatorHubPage({ params }: Props) {
  const { username } = await params;

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      tier: true,
      isPrivate: true,
      isSuspended: true,
    },
  });

  if (!user || user.isSuspended) {
    notFound();
  }

  // If profile is private, show locked state
  if (user.isPrivate) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Private Account</h1>
          <p className="text-gray-400 mb-6">
            This creator page is not available because the account is private.
          </p>
          <Link
            href={`/u/${username}`}
            className="text-emerald-400 hover:text-emerald-300 transition"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  // Check tier eligibility
  if (user.tier === 'free') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Page Not Available</h1>
          <p className="text-gray-400 mb-6">
            @{user.username} hasn&apos;t set up a Creator Page yet.
          </p>
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  // Fetch published creator page
  const page = await prisma.creatorPage.findUnique({
    where: { userId: user.id },
    include: {
      blocks: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // If no page or not published
  if (!page || page.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Page Not Published</h1>
          <p className="text-gray-400 mb-6">
            @{user.username}&apos;s Creator Page is not available yet.
          </p>
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CreatorPageRenderer
      user={{
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        tier: user.tier,
      }}
      page={{
        id: page.id,
        status: page.status,
        themeId: page.themeId,
        hideBranding: page.hideBranding,
        blocks: page.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          sortOrder: block.sortOrder,
          data: block.data as Record<string, unknown>,
        })),
      }}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return { title: 'Not Found' };
  }

  const name = user.displayName || `@${user.username}`;

  return {
    title: `${name} | Creator Hub`,
    description: user.bio || `${name}'s Creator Page on Deebop`,
    openGraph: {
      title: `${name} | Creator Hub`,
      description: user.bio || `${name}'s Creator Page on Deebop`,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  };
}
