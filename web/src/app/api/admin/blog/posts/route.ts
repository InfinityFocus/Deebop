import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function isAdmin(token: string): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return { isAdmin: ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''), userId };
  } catch {
    return { isAdmin: false };
  }
}

// GET /api/admin/blog/posts - List posts with pagination
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;
    const { isAdmin: authorized } = await isAdmin(token || '');

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
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
        status: p.status,
        published_at: p.publishedAt,
        scheduled_for: p.scheduledFor,
        views_count: p.viewsCount,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
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
    console.error('List blog posts error:', error);
    return NextResponse.json({ error: 'Failed to list posts' }, { status: 500 });
  }
}

// POST /api/admin/blog/posts - Create post
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;
    const { isAdmin: authorized, userId } = await isAdmin(token || '');

    if (!authorized || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, featuredImage, status, scheduledFor,
            metaTitle, metaDescription, ogImage, categoryIds, tagIds } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate slug from title
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const publishedAt = status === 'published' ? new Date() : null;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        authorId: userId,
        status: status || 'draft',
        publishedAt,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
        categories: categoryIds?.length ? {
          create: categoryIds.map((id: string) => ({ categoryId: id })),
        } : undefined,
        tags: tagIds?.length ? {
          create: tagIds.map((id: string) => ({ tagId: id })),
        } : undefined,
      },
    });

    // Update category/tag counts
    if (categoryIds?.length) {
      await prisma.blogCategory.updateMany({
        where: { id: { in: categoryIds } },
        data: { postsCount: { increment: 1 } },
      });
    }
    if (tagIds?.length) {
      await prisma.blogTag.updateMany({
        where: { id: { in: tagIds } },
        data: { postsCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ post: { id: post.id, slug: post.slug } });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
