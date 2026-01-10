'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Heart, UserPlus, Share2, Loader2, Repeat, Check, X, Star, Calendar, Images } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface NotificationActor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface NotificationPost {
  id: string;
  content_type: string;
  text_content: string | null;
  media_thumbnail_url: string | null;
}

interface NotificationEvent {
  id: string;
  title: string;
  cover_image_url: string | null;
}

interface NotificationAlbum {
  id: string;
  title: string;
  cover_image_url: string | null;
}

interface Notification {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor | null;
  post: NotificationPost | null;
  event: NotificationEvent | null;
  album: NotificationAlbum | null;
  repost_id?: string;
}

async function fetchNotifications({ pageParam }: { pageParam?: string }) {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

const notificationIcons: Record<string, React.ReactNode> = {
  like: <Heart size={16} className="text-red-500" />,
  follow: <UserPlus size={16} className="text-purple-500" />,
  follow_request: <UserPlus size={16} className="text-yellow-500" />,
  favourite: <Star size={16} className="text-yellow-400" />,
  share: <Share2 size={16} className="text-blue-500" />,
  repost: <Repeat size={16} className="text-emerald-500" />,
  repost_request: <Repeat size={16} className="text-yellow-500" />,
  repost_approved: <Check size={16} className="text-emerald-500" />,
  repost_denied: <X size={16} className="text-red-500" />,
  event_invite: <Calendar size={16} className="text-cyan-500" />,
  album_invite: <Images size={16} className="text-emerald-500" />,
};

const notificationMessages: Record<string, (actor: string) => string> = {
  like: (actor) => `${actor} liked your post`,
  follow: (actor) => `${actor} started following you`,
  follow_request: (actor) => `${actor} requested to follow you`,
  favourite: (actor) => `${actor} added you to their favourites`,
  share: (actor) => `${actor} shared your post`,
  mention: (actor) => `${actor} mentioned you`,
  repost: (actor) => `${actor} reposted your post`,
  repost_request: (actor) => `${actor} wants to repost your post`,
  repost_approved: (actor) => `${actor} approved your repost request`,
  repost_denied: (actor) => `${actor} denied your repost request`,
  event_invite: (actor) => `${actor} invited you to an event`,
  album_invite: (actor) => `${actor} invited you to an album`,
};

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read on mount
  useEffect(() => {
    if (user && data?.pages[0]?.notifications?.some((n: Notification) => !n.is_read)) {
      markReadMutation.mutate();
    }
  }, [user, data]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">Notifications</h1>

      <div className="divide-y divide-gray-800">
        {isError ? (
          <div className="p-4 text-center text-red-400">
            Failed to load notifications
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-500" size={28} />
            </div>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-gray-500">
              When someone likes, follows, or shares your content, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-4 text-purple-400 hover:bg-gray-900 transition"
          >
            {isFetchingNextPage ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Load more'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const queryClient = useQueryClient();
  const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone';
  const message = notificationMessages[notification.type]?.(actorName) || 'New notification';
  const icon = notificationIcons[notification.type] || <Bell size={16} />;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const href = notification.event
    ? `/events/${notification.event.id}`
    : notification.album
    ? `/albums/${notification.album.id}`
    : notification.post
    ? `/p/${notification.post.id}`
    : notification.actor
    ? `/u/${notification.actor.username}`
    : '#';

  // Mutations for repost approval/denial
  const approveRepost = useMutation({
    mutationFn: async (repostId: string) => {
      const res = await fetch(`/api/reposts/requests/${repostId}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve repost');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const denyRepost = useMutation({
    mutationFn: async (repostId: string) => {
      const res = await fetch(`/api/reposts/requests/${repostId}/deny`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to deny repost');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const isRepostRequest = notification.type === 'repost_request';
  const isProcessing = approveRepost.isPending || denyRepost.isPending;

  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.repost_id) {
      approveRepost.mutate(notification.repost_id);
    }
  };

  const handleDeny = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (notification.repost_id) {
      denyRepost.mutate(notification.repost_id);
    }
  };

  return (
    <Link
      href={href}
      className={`flex items-start gap-3 p-4 hover:bg-gray-900/50 transition ${
        !notification.is_read ? 'bg-emerald-500/5' : ''
      }`}
    >
      {/* Actor avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
        {notification.actor?.avatar_url ? (
          <img
            src={notification.actor.avatar_url}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          notification.actor?.username?.[0]?.toUpperCase() || '?'
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-white">{message}</p>
        </div>
        <p className="text-sm text-gray-500 mt-1">{timeAgo}</p>
        {notification.post?.text_content && (
          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
            {notification.post.text_content}
          </p>
        )}
        {notification.event?.title && (
          <p className="text-sm text-gray-300 mt-2 line-clamp-1">
            📅 {notification.event.title}
          </p>
        )}
        {notification.album?.title && (
          <p className="text-sm text-gray-300 mt-2 line-clamp-1">
            📷 {notification.album.title}
          </p>
        )}

        {/* Repost request approval buttons */}
        {isRepostRequest && notification.repost_id && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-1"
            >
              {approveRepost.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Approve
            </button>
            <button
              onClick={handleDeny}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-1"
            >
              {denyRepost.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
              Deny
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {(notification.post?.media_thumbnail_url || notification.event?.cover_image_url || notification.album?.cover_image_url) && (
        <img
          src={notification.post?.media_thumbnail_url || notification.event?.cover_image_url || notification.album?.cover_image_url || ''}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
    </Link>
  );
}
