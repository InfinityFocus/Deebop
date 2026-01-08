export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string;
  status: BlogPostStatus;
  published_at: string | null;
  scheduled_for: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  author?: BlogAuthor;
}

export interface BlogAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  posts_count: number;
  created_at?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  posts_count: number;
  created_at?: string;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogCategoriesResponse {
  categories: BlogCategory[];
}

export interface BlogTagsResponse {
  tags: BlogTag[];
}

// Form data types for creating/updating
export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status?: BlogPostStatus;
  scheduledFor?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

export interface CreateBlogCategoryData {
  name: string;
  description?: string;
}

export interface UpdateBlogCategoryData extends Partial<CreateBlogCategoryData> {
  id: string;
}

export interface CreateBlogTagData {
  name: string;
}

export interface UpdateBlogTagData extends Partial<CreateBlogTagData> {
  id: string;
}
