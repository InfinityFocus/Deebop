import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/blog/[slug] - Get single published blog post (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image: post.featuredImage,
        published_at: post.publishedAt,
        meta_title: post.metaTitle,
        meta_description: post.metaDescription,
        og_image: post.ogImage,
        views_count: post.viewsCount + 1,
        author: post.author ? {
          id: post.author.id,
          username: post.author.username,
          display_name: post.author.displayName,
          avatar_url: post.author.avatarUrl,
        } : null,
        categories: post.categories.map(c => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })),
        tags: post.tags.map(t => ({
          id: t.tag.id,
          name: t.tag.name,
          slug: t.tag.slug,
        })),
      },
    });
  } catch (error) {
    console.error('Get public blog post error:', error);
    return NextResponse.json({ error: 'Failed to get post' }, { status: 500 });
  }
}
