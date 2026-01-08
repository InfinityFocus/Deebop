import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, User, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import prisma from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'News, updates, and stories from the Deebop team.',
};

async function getBlogPosts(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    categories,
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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { posts, total, totalPages, categories } = await getBlogPosts(page);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-400">
            News, updates, and stories from the Deebop team
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main content */}
          <div className="flex-1">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition overflow-hidden"
                  >
                    {post.featuredImage && (
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative h-48 md:h-64 w-full">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {post.categories.map((c) => (
                          <Link
                            key={c.category.id}
                            href={`/blog/category/${c.category.slug}`}
                            className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
                          >
                            {c.category.name}
                          </Link>
                        ))}
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar size={14} />
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold mb-2 hover:text-purple-400 transition">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {post.excerpt && (
                        <p className="text-gray-400 mb-4">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {post.author && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              {post.author.avatarUrl ? (
                                <Image
                                  src={post.author.avatarUrl}
                                  alt={post.author.displayName || post.author.username}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <User size={16} />
                              )}
                              <span>{post.author.displayName || post.author.username}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye size={14} />
                            <span>{post.viewsCount}</span>
                          </div>
                        </div>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition"
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                          {post.tags.map((t) => (
                            <Link
                              key={t.tag.id}
                              href={`/blog/tag/${t.tag.slug}`}
                              className="text-xs text-gray-500 hover:text-gray-300 transition"
                            >
                              #{t.tag.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                {page > 1 ? (
                  <Link
                    href={`/blog?page=${page - 1}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 text-gray-500 cursor-not-allowed">
                    <ChevronLeft size={18} />
                    Previous
                  </span>
                )}
                <span className="text-gray-400">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition"
                  >
                    Next
                    <ChevronRight size={18} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 text-gray-500 cursor-not-allowed">
                    Next
                    <ChevronRight size={18} />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold mb-4">Categories</h3>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog/category/${cat.slug}`}
                        className="flex items-center justify-between text-gray-400 hover:text-white transition"
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-500">{cat.postsCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats */}
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 mt-6">
              <h3 className="font-semibold mb-4">Blog Stats</h3>
              <p className="text-gray-400">
                <span className="text-white font-medium">{total}</span> articles published
              </p>
            </div>
          </aside>
        </div>
      </main>
    <Footer />
    </div>
  );
}
