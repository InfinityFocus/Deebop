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

// Get all reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const reports = await prisma.report.findMany({
      where: status !== 'all' ? { status: status as 'pending' | 'reviewed' | 'action_taken' } : undefined,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        moderator_notes: r.moderatorNotes,
        created_at: r.createdAt,
        reporter: {
          id: r.reporter.id,
          username: r.reporter.username,
          email: r.reporter.email,
        },
        post: {
          id: r.post.id,
          content_type: r.post.contentType,
          text_content: r.post.textContent,
          media_url: r.post.mediaUrl,
          author: {
            id: r.post.user.id,
            username: r.post.user.username,
            email: r.post.user.email,
          },
        },
      })),
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to get reports' },
      { status: 500 }
    );
  }
}
