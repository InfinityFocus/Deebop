import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/users/[username]/relationship - Get relationship status with a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({
        is_blocked: false,
        is_muted: false,
        is_restricted: false,
      });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check relationship status
    const [block, mute, restrict] = await Promise.all([
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUser.id,
            blockedId: targetUser.id,
          },
        },
      }),
      prisma.mute.findUnique({
        where: {
          muterId_mutedId: {
            muterId: currentUser.id,
            mutedId: targetUser.id,
          },
        },
      }),
      prisma.restrict.findUnique({
        where: {
          restricterId_restrictedId: {
            restricterId: currentUser.id,
            restrictedId: targetUser.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      is_blocked: !!block,
      is_muted: !!mute,
      is_restricted: !!restrict,
    });
  } catch (error) {
    console.error('Get relationship error:', error);
    return NextResponse.json({ error: 'Failed to get relationship' }, { status: 500 });
  }
}
