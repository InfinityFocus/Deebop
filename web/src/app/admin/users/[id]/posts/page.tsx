'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Image,
  Video,
  MessageSquare,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Trash2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderOpen,
  Users,
  Lock,
  Globe,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface Post {
  id: string;
  content_type: 'shout' | 'image' | 'video' | 'panorama360';
  text_content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  provenance: string;
  likes_count: number;
  saves_count: number;
  shares_count: number;
  views_count: number;
  reports_count: number;
  created_at: string;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  items_count: number;
  members_count: number;
  likes_count: number;
  saves_count: number;
  views_count: number;
  created_at: string;
}

interface UserPostsResponse {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    email: string;
  };
  posts: Post[];
  albums: Album[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchUserPosts(userId: string, page: number): Promise<UserPostsResponse> {
  const res = await fetch(`/api/admin/users/${userId}/posts?page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export default function AdminUserPostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = use(params);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-user-posts', userId, page],
    queryFn: () => fetchUserPosts(userId, page),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/posts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error('Failed to delete post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-posts', userId] });
    },
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={16} className="text-green-400" />;
      case 'video':
        return <Video size={16} className="text-blue-400" />;
      case 'panorama360':
        return <Eye size={16} className="text-emerald-400" />;
      default:
        return <MessageSquare size={16} className="text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        Failed to load posts.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft size={20} />
          Back to Users
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Posts by @{data?.user.username}
        </h1>
        <p className="text-sm text-gray-400">
          {data?.user.display_name || data?.user.username} · {data?.user.email} · {data?.pagination.total} posts
        </p>
      </div>

      {/* Posts List */}
      {data?.posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <MessageSquare size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">This user has no posts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.posts.map((post) => (
            <div
              key={post.id}
              className={clsx(
                'bg-gray-800 rounded-xl border p-4',
                post.reports_count > 0 ? 'border-red-500/30' : 'border-gray-700'
              )}
            >
              <div className="flex gap-4">
                {/* Media Preview */}
                {post.media_url && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-900">
                    {post.content_type === 'video' ? (
                      <video
                        src={post.media_url}
                        poster={post.media_thumbnail_url || undefined}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.media_thumbnail_url || post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getContentTypeIcon(post.content_type)}
                    <span className="text-xs text-gray-400 capitalize">{post.content_type}</span>
                    {post.provenance !== 'original' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        <Sparkles size={10} />
                        {post.provenance.replace('_', ' ')}
                      </span>
                    )}
                    {post.reports_count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                        <Flag size={10} />
                        {post.reports_count} reports
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {post.text_content && (
                    <p className="text-white text-sm line-clamp-2 mb-2">{post.text_content}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark size={12} /> {post.saves_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 size={12} /> {post.shares_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {post.views_count}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-2">
                  <Link
                    href={`/p/${post.id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                    title="View post"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this post? This cannot be undone.')) {
                        deletePost.mutate(post.id);
                      }
                    }}
                    disabled={deletePost.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50"
                    title="Delete post"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Albums Section */}
      {data?.albums && data.albums.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Albums ({data.albums.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.id}`}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition"
              >
                {/* Album Cover */}
                <div className="aspect-video bg-gray-900 relative">
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen size={48} className="text-gray-700" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {album.visibility === 'public' ? (
                      <Globe size={16} className="text-green-400" />
                    ) : album.visibility === 'followers' ? (
                      <Users size={16} className="text-blue-400" />
                    ) : (
                      <Lock size={16} className="text-yellow-400" />
                    )}
                  </div>
                </div>
                {/* Album Info */}
                <div className="p-4">
                  <h3 className="font-medium text-white truncate">{album.title}</h3>
                  {album.description && (
                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">{album.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Image size={12} /> {album.items_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {album.members_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {album.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {album.views_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
