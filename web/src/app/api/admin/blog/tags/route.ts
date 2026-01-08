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

// GET /api/admin/blog/tags - List all tags
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        posts_count: t.postsCount,
        created_at: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('List blog tags error:', error);
    return NextResponse.json({ error: 'Failed to list tags' }, { status: 500 });
  }
}

// POST /api/admin/blog/tags - Create tag
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

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
    while (await prisma.blogTag.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Check if name already exists
    const existing = await prisma.blogTag.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 400 });
    }

    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        posts_count: tag.postsCount,
      },
    });
  } catch (error) {
    console.error('Create blog tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
