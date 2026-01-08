'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPostEditor } from './BlogPostEditor';
import { Loader2, Save, Eye, Calendar, ChevronDown, X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { BlogPost, BlogCategory, BlogTag, BlogPostStatus } from '@/types/blog';

interface BlogPostFormProps {
  post?: BlogPost;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSubmit: (data: FormData) => Promise<{ id: string; slug: string }>;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: BlogPostStatus;
  scheduledFor: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  categoryIds: string[];
  tagIds: string[];
}

export function BlogPostForm({ post, categories, tags, onSubmit, isLoading }: BlogPostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featuredImage: post?.featured_image || '',
    status: post?.status || 'draft',
    scheduledFor: post?.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : '',
    metaTitle: post?.meta_title || '',
    metaDescription: post?.meta_description || '',
    ogImage: post?.og_image || '',
    categoryIds: post?.categories?.map(c => c.id) || [],
    tagIds: post?.tags?.map(t => t.id) || [],
  });

  const [showSeoFields, setShowSeoFields] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [localTags, setLocalTags] = useState<BlogTag[]>(tags);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  // Sync form data when post prop changes (e.g., after data fetch)
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featuredImage: post.featured_image || '',
        status: post.status || 'draft',
        scheduledFor: post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : '',
        metaTitle: post.meta_title || '',
        metaDescription: post.meta_description || '',
        ogImage: post.og_image || '',
        categoryIds: post.categories?.map(c => c.id) || [],
        tagIds: post.tags?.map(t => t.id) || [],
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent, submitStatus?: BlogPostStatus) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        status: submitStatus || formData.status,
      };
      const result = await onSubmit(dataToSubmit);
      router.push(`/admin/blog/${result.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setIsCreatingTag(true);

    try {
      const res = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const { tag } = await res.json();
      setLocalTags([...localTags, tag]);
      setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
      setNewTagName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const toggleCategory = (id: string) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.includes(id)
        ? formData.categoryIds.filter(c => c !== id)
        : [...formData.categoryIds, id],
    });
  };

  const toggleTag = (id: string) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(id)
        ? formData.tagIds.filter(t => t !== id)
        : [...formData.tagIds, id],
    });
  };

  const handleFeaturedImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const { url } = await response.json();
      setFormData({ ...formData, featuredImage: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Post title"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
            />
          </div>

          {/* Editor */}
          <BlogPostEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Excerpt (optional)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              placeholder="A brief summary of the post..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
            />
          </div>

          {/* SEO Fields */}
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeoFields(!showSeoFields)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 transition"
            >
              <span className="font-medium">SEO Settings</span>
              <ChevronDown className={clsx('transition-transform', showSeoFields && 'rotate-180')} size={20} />
            </button>
            {showSeoFields && (
              <div className="p-4 space-y-4 bg-gray-900">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (defaults to post title)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    rows={2}
                    placeholder="SEO description (defaults to excerpt)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OG Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    placeholder="Social sharing image (defaults to featured image)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Publish Box */}
          <div className="border border-gray-700 rounded-xl p-4 bg-gray-800 space-y-4">
            <h3 className="font-semibold text-white">Publish</h3>

            {/* Status */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BlogPostStatus })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Schedule date (only if scheduled) */}
            {formData.status === 'scheduled' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Publish Date</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
              >
                <Save size={18} />
                Save Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                Publish
              </button>
            </div>

            {formData.status === 'scheduled' && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'scheduled')}
                disabled={isLoading || !formData.scheduledFor}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
              >
                <Calendar size={18} />
                Schedule
              </button>
            )}
          </div>

          {/* Featured Image */}
          <div className="border border-gray-700 rounded-xl p-4 bg-gray-800 space-y-4">
            <h3 className="font-semibold text-white">Featured Image</h3>
            <input
              ref={featuredImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFeaturedImageUpload(file);
                  e.target.value = '';
                }
              }}
            />
            {formData.featuredImage ? (
              <div className="relative">
                <img
                  src={formData.featuredImage}
                  alt="Featured"
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, featuredImage: '' })}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredImageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full aspect-video border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 size={32} className="animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} />
                    <span className="text-sm">Click to upload image</span>
                  </>
                )}
              </button>
            )}
            {formData.featuredImage && (
              <button
                type="button"
                onClick={() => featuredImageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 text-sm"
              >
                {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Replace Image
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="border border-gray-700 rounded-xl p-4 bg-gray-800 space-y-4">
            <h3 className="font-semibold text-white">Categories</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-sm">No categories yet</p>
              ) : (
                categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">{cat.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="border border-gray-700 rounded-xl p-4 bg-gray-800 space-y-4">
            <h3 className="font-semibold text-white">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {localTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-sm transition',
                    formData.tagIds.includes(tag.id)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add new tag"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={isCreatingTag || !newTagName.trim()}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
              >
                {isCreatingTag ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
