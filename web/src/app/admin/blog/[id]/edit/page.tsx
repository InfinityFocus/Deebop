'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { BlogPost, BlogCategoriesResponse, BlogTagsResponse } from '@/types/blog';

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: postData, isLoading: postLoading, isError: postError } = useQuery<{ post: BlogPost }>({
    queryKey: ['admin-blog-post', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<BlogCategoriesResponse>({
    queryKey: ['admin-blog-categories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const { data: tagsData } = useQuery<BlogTagsResponse>({
    queryKey: ['admin-blog-tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    },
  });

  const handleSubmit = async (formData: {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    status: string;
    scheduledFor: string;
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    categoryIds: string[];
    tagIds: string[];
  }) => {
    setIsSubmitting(true);

    const res = await fetch(`/api/admin/blog/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update post');
    }

    const { post } = await res.json();
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-blog-post', id] });
    setIsSubmitting(false);
    return post;
  };

  if (postLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (postError || !postData?.post) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Failed to load post</p>
          <Link href="/admin/blog" className="text-emerald-400 hover:text-emerald-300">
            Back to posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-gray-400 mt-1">Editing: {postData.post.title}</p>
        </div>
      </div>

      {/* Form */}
      <BlogPostForm
        post={postData.post}
        categories={categoriesData?.categories || []}
        tags={tagsData?.tags || []}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
