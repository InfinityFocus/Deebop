import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

async function isAdmin(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return ADMIN_EMAILS.includes(user?.email || '');
  } catch {
    return false;
  }
}

// Get all posts by a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get posts with pagination
    const [posts, total, albums] = await Promise.all([
      prisma.post.findMany({
        where: { userId: id },
        select: {
          id: true,
          contentType: true,
          description: true,
          mediaUrl: true,
          mediaThumbnailUrl: true,
          provenance: true,
          likesCount: true,
          savesCount: true,
          sharesCount: true,
          viewsCount: true,
          createdAt: true,
          _count: {
            select: {
              reports: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: { userId: id } }),
      prisma.album.findMany({
        where: { ownerId: id },
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          visibility: true,
          itemsCount: true,
          membersCount: true,
          likesCount: true,
          savesCount: true,
          viewsCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        email: user.email,
      },
      posts: posts.map((p) => ({
        id: p.id,
        content_type: p.contentType,
        text_content: p.description,
        media_url: p.mediaUrl,
        media_thumbnail_url: p.mediaThumbnailUrl,
        provenance: p.provenance,
        likes_count: p.likesCount,
        saves_count: p.savesCount,
        shares_count: p.sharesCount,
        views_count: p.viewsCount,
        reports_count: p._count.reports,
        created_at: p.createdAt,
      })),
      albums: albums.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        cover_image_url: a.coverImageUrl,
        visibility: a.visibility,
        items_count: a.itemsCount,
        members_count: a.membersCount,
        likes_count: a.likesCount,
        saves_count: a.savesCount,
        views_count: a.viewsCount,
        created_at: a.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json(
      { error: 'Failed to get user posts' },
      { status: 500 }
    );
  }
}

// Delete a specific post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Verify post belongs to user
    const post = await prisma.post.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
