import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function isAdmin(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '');
  } catch {
    return false;
  }
}

// GET /api/admin/blog/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image: post.featuredImage,
        author_id: post.authorId,
        status: post.status,
        published_at: post.publishedAt,
        scheduled_for: post.scheduledFor,
        meta_title: post.metaTitle,
        meta_description: post.metaDescription,
        og_image: post.ogImage,
        views_count: post.viewsCount,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
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
    console.error('Get blog post error:', error);
    return NextResponse.json({ error: 'Failed to get post' }, { status: 500 });
  }
}

// PATCH /api/admin/blog/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { title, content, excerpt, featuredImage, status, scheduledFor,
            metaTitle, metaDescription, ogImage, categoryIds, tagIds } = body;

    // Handle slug update if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      const baseSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      slug = baseSlug;
      let counter = 1;
      while (await prisma.blogPost.findFirst({ where: { slug, id: { not: id } } })) {
        slug = `${baseSlug}-${counter++}`;
      }
    }

    // Handle publishedAt based on status change
    let publishedAt = existingPost.publishedAt;
    if (status === 'published' && existingPost.status !== 'published') {
      publishedAt = new Date();
    } else if (status === 'draft') {
      publishedAt = null;
    }

    // Update category relationships
    const oldCategoryIds = existingPost.categories.map(c => c.categoryId);
    const newCategoryIds = categoryIds || [];
    const categoriesToRemove = oldCategoryIds.filter((id: string) => !newCategoryIds.includes(id));
    const categoriesToAdd = newCategoryIds.filter((id: string) => !oldCategoryIds.includes(id));

    // Update tag relationships
    const oldTagIds = existingPost.tags.map(t => t.tagId);
    const newTagIds = tagIds || [];
    const tagsToRemove = oldTagIds.filter((id: string) => !newTagIds.includes(id));
    const tagsToAdd = newTagIds.filter((id: string) => !oldTagIds.includes(id));

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title ?? existingPost.title,
        slug,
        content: content ?? existingPost.content,
        excerpt: excerpt !== undefined ? excerpt : existingPost.excerpt,
        featuredImage: featuredImage !== undefined ? featuredImage : existingPost.featuredImage,
        status: status ?? existingPost.status,
        publishedAt,
        scheduledFor: scheduledFor !== undefined ? (scheduledFor ? new Date(scheduledFor) : null) : existingPost.scheduledFor,
        metaTitle: metaTitle !== undefined ? metaTitle : existingPost.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existingPost.metaDescription,
        ogImage: ogImage !== undefined ? ogImage : existingPost.ogImage,
        categories: categoryIds !== undefined ? {
          deleteMany: {},
          create: newCategoryIds.map((catId: string) => ({ categoryId: catId })),
        } : undefined,
        tags: tagIds !== undefined ? {
          deleteMany: {},
          create: newTagIds.map((tagId: string) => ({ tagId })),
        } : undefined,
      },
    });

    // Update category counts
    if (categoriesToRemove.length > 0) {
      await prisma.blogCategory.updateMany({
        where: { id: { in: categoriesToRemove } },
        data: { postsCount: { decrement: 1 } },
      });
    }
    if (categoriesToAdd.length > 0) {
      await prisma.blogCategory.updateMany({
        where: { id: { in: categoriesToAdd } },
        data: { postsCount: { increment: 1 } },
      });
    }

    // Update tag counts
    if (tagsToRemove.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: tagsToRemove } },
        data: { postsCount: { decrement: 1 } },
      });
    }
    if (tagsToAdd.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: tagsToAdd } },
        data: { postsCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ post: { id: post.id, slug: post.slug } });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/admin/blog/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post (cascade will handle join tables)
    await prisma.blogPost.delete({ where: { id } });

    // Decrement category counts
    const categoryIds = post.categories.map(c => c.categoryId);
    if (categoryIds.length > 0) {
      await prisma.blogCategory.updateMany({
        where: { id: { in: categoryIds } },
        data: { postsCount: { decrement: 1 } },
      });
    }

    // Decrement tag counts
    const tagIds = post.tags.map(t => t.tagId);
    if (tagIds.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: tagIds } },
        data: { postsCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
