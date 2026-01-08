import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, User, Eye, Tag, Folder } from 'lucide-react';
import prisma from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'published',
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (post) {
    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } },
    });
  }

  return post;
}

async function getRelatedPosts(postId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  return prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: 'published',
      publishedAt: { lte: new Date() },
      categories: {
        some: {
          categoryId: { in: categoryIds },
        },
      },
    },
    include: {
      categories: { include: { category: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'published' },
    select: { title: true, excerpt: true, metaTitle: true, metaDescription: true, ogImage: true, featuredImage: true },
  });

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || `Read ${post.title} on Deebop Blog`,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.ogImage || post.featuredImage ? [post.ogImage || post.featuredImage!] : undefined,
      type: 'article',
    },
  };
}

function formatDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const categoryIds = post.categories.map((c) => c.categoryId);
  const relatedPosts = await getRelatedPosts(post.id, categoryIds);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to blog
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Folder size={16} className="text-gray-500" />
            {post.categories.map((c) => (
              <Link
                key={c.category.id}
                href={`/blog/category/${c.category.slug}`}
                className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
              >
                {c.category.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-800">
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.avatarUrl ? (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.displayName || post.author.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{post.author.displayName || post.author.username}</p>
                <p className="text-sm text-gray-500">@{post.author.username}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={16} />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Eye size={16} />
            <span>{post.viewsCount + 1} views</span>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-purple max-w-none
            prose-headings:font-bold prose-headings:text-white
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-li:marker:text-purple-400
            prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400
            prose-code:text-purple-300 prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
            prose-img:rounded-xl prose-img:border prose-img:border-gray-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-8 mt-8 border-t border-gray-800">
            <Tag size={16} className="text-gray-500" />
            {post.tags.map((t) => (
              <Link
                key={t.tag.id}
                href={`/blog/tag/${t.tag.slug}`}
                className="px-3 py-1 text-sm rounded-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
              >
                #{t.tag.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((relPost) => (
              <Link
                key={relPost.id}
                href={`/blog/${relPost.slug}`}
                className="rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition overflow-hidden"
              >
                {relPost.featuredImage && (
                  <div className="relative h-32 w-full">
                    <Image
                      src={relPost.featuredImage}
                      alt={relPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2 hover:text-purple-400 transition">
                    {relPost.title}
                  </h3>
                  {relPost.categories.length > 0 && (
                    <p className="text-sm text-purple-400 mt-2">
                      {relPost.categories[0].category.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
