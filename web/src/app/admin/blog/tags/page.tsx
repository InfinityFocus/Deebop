'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, Edit, Trash2, X, Check, Tag } from 'lucide-react';
import type { BlogTagsResponse, BlogTag } from '@/types/blog';

export default function AdminBlogTagsPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<BlogTagsResponse>({
    queryKey: ['admin-blog-tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      setNewName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/admin/blog/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/tags/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tag');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      setDeleteId(null);
    },
  });

  const startEdit = (tag: BlogTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-gray-400 mt-1">Manage blog tags</p>
        </div>
      </div>

      {/* Add new tag */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-4">Add Tag</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                createMutation.mutate(newName);
              }
            }}
          />
          <button
            onClick={() => createMutation.mutate(newName)}
            disabled={!newName.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add Tag
          </button>
        </div>
        {createMutation.isError && (
          <p className="text-red-400 text-sm mt-2">{(createMutation.error as Error).message}</p>
        )}
      </div>

      {/* Tags list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-400">Failed to load tags</div>
      ) : data?.tags.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400">No tags yet</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {data?.tags.map((tag) => (
            <div key={tag.id} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
              {editingId === tag.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-32 px-2 py-1 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => updateMutation.mutate({ id: tag.id, name: editName })}
                    disabled={updateMutation.isPending}
                    className="p-1 text-green-400 hover:text-green-300 transition"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400 hover:text-white transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-white">{tag.name}</span>
                  <span className="text-gray-500 text-xs">({tag.posts_count})</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(tag.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Tag</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to delete this tag? Posts will be unlinked but not deleted.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
