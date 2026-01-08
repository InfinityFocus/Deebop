import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/blog/posts - Get published blog posts (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'published',
      publishedAt: { lte: new Date() },
    };

    // Filter by category slug
    if (category) {
      where.categories = {
        some: {
          category: { slug: category },
        },
      };
    }

    // Filter by tag slug
    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag },
        },
      };
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        featured_image: p.featuredImage,
        published_at: p.publishedAt,
        views_count: p.viewsCount,
        author: p.author ? {
          id: p.author.id,
          username: p.author.username,
          display_name: p.author.displayName,
          avatar_url: p.author.avatarUrl,
        } : null,
        categories: p.categories.map(c => ({
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
        })),
        tags: p.tags.map(t => ({
          id: t.tag.id,
          name: t.tag.name,
          slug: t.tag.slug,
        })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List public blog posts error:', error);
    return NextResponse.json({ error: 'Failed to list posts' }, { status: 500 });
  }
}
