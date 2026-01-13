import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// POST /api/users/me/deactivate - Deactivate account (reversible)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password, confirm } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!confirm) {
      return NextResponse.json({ error: 'Please confirm deactivation' }, { status: 400 });
    }

    // Verify password
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, fullUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Deactivate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeactivated: true,
        deactivatedAt: new Date(),
      },
    });

    // Clear auth cookie
    const cookieStore = await cookies();
    cookieStore.delete('deebop-auth');

    return NextResponse.json({
      success: true,
      message: 'Account deactivated. You can reactivate by logging in again.',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 });
  }
}

// DELETE /api/users/me/deactivate - Reactivate account
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reactivate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeactivated: false,
        deactivatedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account reactivated successfully.',
    });
  } catch (error) {
    console.error('Reactivate account error:', error);
    return NextResponse.json({ error: 'Failed to reactivate account' }, { status: 500 });
  }
}
