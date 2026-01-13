import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/muted - List users you've muted
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const muted = await prisma.mute.findMany({
      where: { muterId: user.id },
      include: {
        muted: {
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
      muted: muted.map((m) => ({
        id: m.muted.id,
        username: m.muted.username,
        display_name: m.muted.displayName,
        avatar_url: m.muted.avatarUrl,
        muted_at: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get muted users error:', error);
    return NextResponse.json({ error: 'Failed to get muted users' }, { status: 500 });
  }
}
