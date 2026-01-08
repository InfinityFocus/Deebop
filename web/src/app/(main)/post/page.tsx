'use client';

import { useAuth } from '@/hooks/useAuth';
import { CreatePostForm } from '@/components/post/CreatePostForm';

export default function PostPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  return <CreatePostForm />;
}
