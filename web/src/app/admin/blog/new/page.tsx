'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { BlogCategoriesResponse, BlogTagsResponse } from '@/types/blog';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const res = await fetch('/api/admin/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create post');
    }

    const { post } = await res.json();
    setIsSubmitting(false);
    return post;
  };

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
          <h1 className="text-2xl font-bold">New Post</h1>
          <p className="text-gray-400 mt-1">Create a new blog post</p>
        </div>
      </div>

      {/* Form */}
      <BlogPostForm
        categories={categoriesData?.categories || []}
        tags={tagsData?.tags || []}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
