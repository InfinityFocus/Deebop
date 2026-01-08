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

// Get doom scroll settings (create default if none exists)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.doomScrollSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.doomScrollSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        isEnabled: settings.isEnabled,
        postsThreshold: settings.postsThreshold,
        timeThresholdSeconds: settings.timeThresholdSeconds,
        breakDurationSeconds: settings.breakDurationSeconds,
        title: settings.title,
        message: settings.message,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get wellbeing settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get wellbeing settings' },
      { status: 500 }
    );
  }
}

// Update doom scroll settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, postsThreshold, timeThresholdSeconds, breakDurationSeconds, title, message } = body;

    // Get existing settings or create default
    let settings = await prisma.doomScrollSettings.findFirst();
    if (!settings) {
      settings = await prisma.doomScrollSettings.create({
        data: {},
      });
    }

    // Build update data
    const updateData: {
      isEnabled?: boolean;
      postsThreshold?: number;
      timeThresholdSeconds?: number;
      breakDurationSeconds?: number;
      title?: string;
      message?: string;
    } = {};

    if (typeof isEnabled === 'boolean') {
      updateData.isEnabled = isEnabled;
    }
    if (typeof postsThreshold === 'number' && postsThreshold >= 1) {
      updateData.postsThreshold = postsThreshold;
    }
    if (typeof timeThresholdSeconds === 'number' && timeThresholdSeconds >= 60) {
      updateData.timeThresholdSeconds = timeThresholdSeconds;
    }
    if (typeof breakDurationSeconds === 'number' && breakDurationSeconds >= 60) {
      updateData.breakDurationSeconds = breakDurationSeconds;
    }
    if (typeof title === 'string' && title.trim()) {
      updateData.title = title.trim();
    }
    if (typeof message === 'string' && message.trim()) {
      updateData.message = message.trim();
    }

    const updated = await prisma.doomScrollSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      settings: {
        id: updated.id,
        isEnabled: updated.isEnabled,
        postsThreshold: updated.postsThreshold,
        timeThresholdSeconds: updated.timeThresholdSeconds,
        breakDurationSeconds: updated.breakDurationSeconds,
        title: updated.title,
        message: updated.message,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update wellbeing settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update wellbeing settings' },
      { status: 500 }
    );
  }
}
