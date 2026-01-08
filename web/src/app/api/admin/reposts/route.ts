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

// Get repost settings (create default if none exists)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.repostSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.repostSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        allowChainReposts: settings.allowChainReposts,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get repost settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get repost settings' },
      { status: 500 }
    );
  }
}

// Update repost settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { allowChainReposts } = body;

    // Get existing settings or create default
    let settings = await prisma.repostSettings.findFirst();
    if (!settings) {
      settings = await prisma.repostSettings.create({
        data: {},
      });
    }

    // Build update data
    const updateData: {
      allowChainReposts?: boolean;
    } = {};

    if (typeof allowChainReposts === 'boolean') {
      updateData.allowChainReposts = allowChainReposts;
    }

    const updated = await prisma.repostSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      settings: {
        id: updated.id,
        allowChainReposts: updated.allowChainReposts,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update repost settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update repost settings' },
      { status: 500 }
    );
  }
}
