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

// GET /api/admin/blog/categories - List all categories
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        posts_count: c.postsCount,
        created_at: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('List blog categories error:', error);
    return NextResponse.json({ error: 'Failed to list categories' }, { status: 500 });
  }
}

// POST /api/admin/blog/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogCategory.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Check if name already exists
    const existing = await prisma.blogCategory.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        posts_count: category.postsCount,
      },
    });
  } catch (error) {
    console.error('Create blog category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
