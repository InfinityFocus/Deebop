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

// Update report status and take action
export async function PATCH(
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

    const { action, moderatorNotes } = await request.json();

    const report = await prisma.report.findUnique({
      where: { id },
      include: { post: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'dismiss':
        // Mark as reviewed but no action taken
        await prisma.report.update({
          where: { id },
          data: {
            status: 'reviewed',
            moderatorNotes: moderatorNotes || 'Dismissed - no violation found',
          },
        });
        break;

      case 'remove_post':
        // Delete the reported post
        await prisma.post.delete({
          where: { id: report.postId },
        });
        // Update report status
        await prisma.report.update({
          where: { id },
          data: {
            status: 'action_taken',
            moderatorNotes: moderatorNotes || 'Post removed',
          },
        });
        break;

      case 'warn_user':
        // Mark report and add warning note
        await prisma.report.update({
          where: { id },
          data: {
            status: 'action_taken',
            moderatorNotes: moderatorNotes || 'User warned',
          },
        });
        // Could implement a warnings table or notification
        break;

      case 'suspend_user':
        // Suspend the post author
        await prisma.user.update({
          where: { id: report.post.userId },
          data: {
            // Add a suspended field if needed, or set tier to suspended
            bio: '[SUSPENDED] ' + (await prisma.user.findUnique({
              where: { id: report.post.userId },
              select: { bio: true },
            }))?.bio || '',
          },
        });
        await prisma.report.update({
          where: { id },
          data: {
            status: 'action_taken',
            moderatorNotes: moderatorNotes || 'User suspended',
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
