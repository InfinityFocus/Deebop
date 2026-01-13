import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/me/restricted - List users you've restricted
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restricted = await prisma.restrict.findMany({
      where: { restricterId: user.id },
      include: {
        restricted: {
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
      restricted: restricted.map((r) => ({
        id: r.restricted.id,
        username: r.restricted.username,
        display_name: r.restricted.displayName,
        avatar_url: r.restricted.avatarUrl,
        restricted_at: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get restricted users error:', error);
    return NextResponse.json({ error: 'Failed to get restricted users' }, { status: 500 });
  }
}
