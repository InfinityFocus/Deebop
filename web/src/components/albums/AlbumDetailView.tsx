'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Lock,
  Globe,
  Users,
  Settings,
  UserPlus,
  Upload,
  Trash2,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAlbum, useDeleteAlbum } from '@/hooks/useAlbum';
import { AlbumItemGrid } from './AlbumItemGrid';
import { AlbumMemberList } from './AlbumMemberList';
import { AlbumInviteModal } from './AlbumInviteModal';
import type { AlbumRole } from '@/types/album';

interface AlbumDetailViewProps {
  albumId: string;
  currentUserId: string | null;
}

export function AlbumDetailView({ albumId, currentUserId }: AlbumDetailViewProps) {
  const router = useRouter();
  const { album, isLoading, isError } = useAlbum(albumId);
  const deleteAlbum = useDeleteAlbum();

  const [activeTab, setActiveTab] = useState<'items' | 'members'>('items');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Update local state when album loads
  useEffect(() => {
    if (album) {
      setIsLiked(album.is_liked);
      setIsSaved(album.is_saved);
      setLikesCount(album.likes_count);
    }
  }, [album]);

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/albums/${albumId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/albums/${albumId}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/albums/${albumId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: album?.title });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this album? This cannot be undone.')) return;

    try {
      await deleteAlbum.mutateAsync(albumId);
      router.push('/albums');
    } catch (err) {
      console.error('Failed to delete album:', err);
      alert('Failed to delete album');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError || !album) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Failed to load album</p>
        <Link href="/albums" className="text-emerald-400 hover:underline">
          Back to Albums
        </Link>
      </div>
    );
  }

  // Find current user's role
  const currentMember = album.members.find((m) => m.user.id === currentUserId);
  const currentUserRole: AlbumRole | null = currentMember?.role || null;
  const isOwner = currentUserRole === 'owner';
  const canManage = currentUserRole === 'owner' || currentUserRole === 'co_owner';

  // For event albums, use event-based upload permission
  // For regular albums, use role-based permission (must be a member)
  const isEventAlbum = !!album.linked_event_id;
  const canUpload = isEventAlbum
    ? album.can_upload_to_event === true
    : currentUserRole !== null;

  const timeAgo = formatDistanceToNow(new Date(album.created_at), { addSuffix: true });

  const visibilityIcon =
    album.visibility === 'public' ? Globe : album.visibility === 'followers' ? Users : Lock;
  const VisibilityIcon = visibilityIcon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/albums"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={18} />
          Back to Albums
        </Link>

        {/* Cover Image */}
        {album.cover_image_url && (
          <div className="aspect-[3/1] rounded-xl overflow-hidden mb-6 bg-gray-800">
            <img
              src={album.cover_image_url}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{album.title}</h1>
            {album.description && (
              <p className="text-gray-400 mb-3">{album.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <VisibilityIcon size={14} />
                {album.visibility === 'public'
                  ? 'Public'
                  : album.visibility === 'followers'
                  ? 'Followers only'
                  : 'Private'}
              </div>
              {album.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {album.location}
                </div>
              )}
              <span>{album.items_count} items</span>
              <span>
                {isEventAlbum
                  ? `${(album.event_host ? 1 : 0) + (album.event_attendees?.attending?.length || 0) + (album.event_attendees?.maybe?.length || 0)} attendees`
                  : `${album.members_count} members`}
              </span>
              <span>{timeAgo}</span>
            </div>

            {/* Hashtags */}
            {album.hashtags && album.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {album.hashtags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore/hashtag/${tag}`}
                    className="text-emerald-400 hover:underline text-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Owner Info */}
          <Link
            href={`/u/${album.owner.username}`}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              {album.owner.avatar_url ? (
                <img
                  src={album.owner.avatar_url}
                  alt={album.owner.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                album.owner.display_name?.[0]?.toUpperCase() ||
                album.owner.username[0].toUpperCase()
              )}
            </div>
            <div>
              <p className="font-medium text-white">
                {album.owner.display_name || album.owner.username}
              </p>
              <p className="text-sm text-gray-500">@{album.owner.username}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between py-4 border-y border-gray-800 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 group"
          >
            <Heart
              size={20}
              className={clsx(
                'transition',
                isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'
              )}
            />
            {likesCount > 0 && (
              <span className={clsx('text-sm', isLiked ? 'text-red-500' : 'text-gray-400')}>
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 group"
          >
            <Bookmark
              size={20}
              className={clsx(
                'transition',
                isSaved
                  ? 'fill-emerald-500 text-emerald-500'
                  : 'text-gray-400 group-hover:text-emerald-500'
              )}
            />
          </button>

          <button onClick={handleShare} className="group">
            <Share2 size={20} className="text-gray-400 group-hover:text-blue-500 transition" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canUpload && (
            <Link
              href={`/albums/${albumId}/upload`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition"
            >
              <Upload size={16} />
              Upload
            </Link>
          )}

          {canManage && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
            >
              <UserPlus size={16} />
              Invite
            </button>
          )}

          {isOwner && (
            <>
              <Link
                href={`/albums/${albumId}/edit`}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                <Settings size={18} className="text-gray-400" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteAlbum.isPending}
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-500/20 transition"
              >
                {deleteAlbum.isPending ? (
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                ) : (
                  <Trash2 size={18} className="text-gray-400 hover:text-red-500" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('items')}
          className={clsx(
            'pb-3 px-1 font-medium transition border-b-2',
            activeTab === 'items'
              ? 'text-white border-emerald-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          )}
        >
          Items ({album.items_count})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={clsx(
            'pb-3 px-1 font-medium transition border-b-2',
            activeTab === 'members'
              ? 'text-white border-emerald-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          )}
        >
          {isEventAlbum ? 'Attendees' : 'Members'} ({
            isEventAlbum
              ? (album.event_host ? 1 : 0) +
                (album.event_attendees?.attending?.length || 0) +
                (album.event_attendees?.maybe?.length || 0)
              : album.members_count
          })
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' ? (
        <AlbumItemGrid
          albumId={albumId}
          albumTitle={album.title}
          items={album.items || []}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      ) : (
        <AlbumMemberList
          albumId={albumId}
          members={album.members}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          linkedEventId={album.linked_event_id}
          eventHost={album.event_host}
          eventAttendees={album.event_attendees}
          canViewAttendeeList={album.can_view_attendee_list}
        />
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <AlbumInviteModal
          albumId={albumId}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
