import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/users/[username]/restrict - Toggle restrict (their interactions only visible to them)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot restrict yourself' }, { status: 400 });
    }

    // Check if already restricted
    const existingRestrict = await prisma.restrict.findUnique({
      where: {
        restricterId_restrictedId: {
          restricterId: user.id,
          restrictedId: targetUser.id,
        },
      },
    });

    if (existingRestrict) {
      // Unrestrict
      await prisma.restrict.delete({
        where: {
          restricterId_restrictedId: {
            restricterId: user.id,
            restrictedId: targetUser.id,
          },
        },
      });

      return NextResponse.json({ restricted: false });
    } else {
      // Restrict user (no notification - they shouldn't know)
      await prisma.restrict.create({
        data: {
          restricterId: user.id,
          restrictedId: targetUser.id,
        },
      });

      return NextResponse.json({ restricted: true });
    }
  } catch (error) {
    console.error('Restrict error:', error);
    return NextResponse.json({ error: 'Failed to toggle restrict' }, { status: 500 });
  }
}

// GET /api/users/[username]/restrict - Check if user is restricted
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const restrict = await prisma.restrict.findUnique({
      where: {
        restricterId_restrictedId: {
          restricterId: user.id,
          restrictedId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ restricted: !!restrict });
  } catch (error) {
    console.error('Check restrict error:', error);
    return NextResponse.json({ error: 'Failed to check restrict status' }, { status: 500 });
  }
}
