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

// GET /api/admin/favourites - Get favourites settings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.favouritesSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.favouritesSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        isEnabled: settings.isEnabled,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get favourites settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get favourites settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/favourites - Update favourites settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled } = body;

    // Get existing settings or create default
    let settings = await prisma.favouritesSettings.findFirst();
    if (!settings) {
      settings = await prisma.favouritesSettings.create({
        data: {},
      });
    }

    // Build update data
    const updateData: {
      isEnabled?: boolean;
    } = {};

    if (typeof isEnabled === 'boolean') {
      updateData.isEnabled = isEnabled;
    }

    const updated = await prisma.favouritesSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      settings: {
        id: updated.id,
        isEnabled: updated.isEnabled,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update favourites settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update favourites settings' },
      { status: 500 }
    );
  }
}
