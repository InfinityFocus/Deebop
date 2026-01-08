import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/posts/[id]/save - Toggle save/bookmark
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already saved
    const existingSave = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await prisma.save.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });

      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.save.create({
        data: {
          userId: user.id,
          postId,
        },
      });

      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to toggle save' }, { status: 500 });
  }
}
