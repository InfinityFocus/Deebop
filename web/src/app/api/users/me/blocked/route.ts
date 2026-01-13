import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/blocked - List users you've blocked
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blocked = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      blocked: blocked.map((b) => ({
        id: b.blocked.id,
        username: b.blocked.username,
        display_name: b.blocked.displayName,
        avatar_url: b.blocked.avatarUrl,
        blocked_at: b.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    return NextResponse.json({ error: 'Failed to get blocked users' }, { status: 500 });
  }
}
