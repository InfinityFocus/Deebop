'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Bell,
  BellOff,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Film,
  Type,
  Disc,
  Folder,
} from 'lucide-react';
import { useCountdown, formatCountdown } from '@/hooks/useCountdown';
import { clsx } from 'clsx';

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier?: string;
}

interface Drop {
  id: string;
  type: 'post' | 'album';
  content_type: string;
  title: string | null;
  headline_style?: string;
  description: string | null;
  preview_url: string | null;
  preview_items?: Array<{ id: string; thumbnail_url: string }>;
  hide_teaser: boolean;
  visibility: string;
  provenance?: string;
  status: string;
  scheduled_for: string | null;
  dropped_at: string | null;
  created_at: string;
  creator: Creator;
  is_own: boolean;
}

const contentTypeIcons: Record<string, typeof ImageIcon> = {
  shout: Type,
  image: ImageIcon,
  video: Film,
  panorama360: Disc,
  album: Folder,
};

const contentTypeLabels: Record<string, string> = {
  shout: 'Shout',
  image: 'Image',
  video: 'Video',
  panorama360: '360 Panorama',
  album: 'Album',
};

export function DropContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const type = searchParams.get('type') || 'post';

  const [drop, setDrop] = useState<Drop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const countdown = useCountdown(drop?.scheduled_for || null);
  const Icon = drop ? contentTypeIcons[drop.content_type] || ImageIcon : ImageIcon;

  // Fetch drop details
  useEffect(() => {
    const fetchDrop = async () => {
      try {
        const response = await fetch(`/api/drops/${id}?type=${type}`);
        if (!response.ok) {
          throw new Error('Drop not found');
        }
        const data = await response.json();
        setDrop(data.drop);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load drop');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrop();
  }, [id, type]);

  // If the drop has been published, redirect to the actual content
  useEffect(() => {
    if (drop?.status === 'published') {
      if (drop.type === 'album') {
        router.replace(`/(main)/albums/${drop.id}`);
      } else {
        // For posts, redirect to home or the post view
        router.replace('/(main)/home');
      }
    }
  }, [drop, router]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/drops/${id}?type=${type}`;
    const shareText = drop?.title
      ? `Check out this upcoming drop: ${drop.title}`
      : 'Check out this upcoming drop!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: drop?.title || 'Upcoming Drop',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleCancelDrop = async () => {
    if (!drop?.is_own) return;
    if (!confirm('Are you sure you want to cancel this scheduled drop? It will be published immediately.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const endpoint = drop.type === 'album'
        ? `/api/albums/${drop.id}`
        : `/api/posts/${drop.id}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_schedule: true }),
      });

      if (response.ok) {
        // Redirect to the published content
        if (drop.type === 'album') {
          router.push(`/(main)/albums/${drop.id}`);
        } else {
          router.push('/(main)/home');
        }
      }
    } catch (err) {
      console.error('Failed to cancel drop:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-semibold mb-2">Drop not found</h1>
        <p className="text-zinc-400 mb-4">This drop may have been deleted or you don't have permission to view it.</p>
        <Link
          href="/(main)/home"
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Go back home
        </Link>
      </div>
    );
  }

  const showPreview = !drop.hide_teaser && drop.preview_url;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Upcoming Drop</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Preview area */}
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-6">
          {showPreview ? (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={drop.preview_url!}
                  alt="Drop preview"
                  fill
                  className="object-cover blur-2xl scale-125"
                />
              </div>
              <div className="absolute inset-0 bg-black/50" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <Icon className="w-24 h-24 text-zinc-700" />
            </div>
          )}

          {/* Countdown overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Clock className="w-6 h-6" />
              <span className="text-lg font-medium uppercase tracking-wide">Drops in</span>
            </div>
            <div className="text-5xl font-bold text-white font-mono mb-4">
              {formatCountdown(countdown)}
            </div>
            {drop.scheduled_for && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(drop.scheduled_for).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Content type badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
            <Icon className="w-4 h-4" />
            <span>{contentTypeLabels[drop.content_type]}</span>
          </div>

          {/* News badge */}
          {drop.headline_style === 'news' && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded">
              NEWS
            </div>
          )}
        </div>

        {/* Creator info */}
        <Link
          href={`/u/${drop.creator.username}`}
          className="flex items-center gap-3 mb-6 p-3 -mx-3 rounded-xl hover:bg-zinc-900/50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden shrink-0">
            {drop.creator.avatar_url ? (
              <Image
                src={drop.creator.avatar_url}
                alt={drop.creator.display_name || drop.creator.username}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-lg font-medium">
                {(drop.creator.display_name || drop.creator.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">
              {drop.creator.display_name || drop.creator.username}
            </p>
            <p className="text-sm text-zinc-500">@{drop.creator.username}</p>
          </div>
        </Link>

        {/* Title and description */}
        {drop.title && (
          <h2 className="text-2xl font-bold text-white mb-3">{drop.title}</h2>
        )}
        {drop.description && (
          <p className="text-zinc-300 mb-6 whitespace-pre-wrap">{drop.description}</p>
        )}

        {/* Album preview items */}
        {drop.type === 'album' && drop.preview_items && drop.preview_items.length > 0 && !drop.hide_teaser && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-2">Preview</h3>
            <div className="grid grid-cols-4 gap-2">
              {drop.preview_items.map((item) => (
                <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                  <Image
                    src={item.thumbnail_url}
                    alt=""
                    width={100}
                    height={100}
                    className="w-full h-full object-cover blur-md"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setNotifyEnabled(!notifyEnabled)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors',
              notifyEnabled
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            )}
          >
            {notifyEnabled ? (
              <>
                <BellOff className="w-5 h-5" />
                <span>Notifications On</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Notify Me</span>
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>

        {/* Owner actions */}
        {drop.is_own && (
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Manage your drop</h3>
            <div className="flex gap-3">
              <Link
                href={`/${drop.type === 'album' ? 'albums' : 'post'}/${drop.id}/edit`}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                <Pencil className="w-5 h-5" />
                <span>Edit</span>
              </Link>
              <button
                onClick={handleCancelDrop}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>{isUpdating ? 'Canceling...' : 'Cancel'}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
