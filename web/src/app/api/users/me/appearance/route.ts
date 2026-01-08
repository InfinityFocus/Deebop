import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// GET /api/users/me/appearance - Get appearance preferences
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
        fontSize: true,
        reducedMotion: true,
        highContrast: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      theme: user.theme,
      fontSize: user.fontSize,
      reducedMotion: user.reducedMotion,
      highContrast: user.highContrast,
    });
  } catch (error) {
    console.error('Get appearance preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get appearance preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me/appearance - Update appearance preferences
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { theme, fontSize, reducedMotion, highContrast } = body;

    // Validate theme value
    const validThemes = ['dark', 'light', 'system'];
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value. Must be: dark, light, or system' },
        { status: 400 }
      );
    }

    // Validate fontSize value
    const validFontSizes = ['small', 'medium', 'large'];
    if (fontSize && !validFontSizes.includes(fontSize)) {
      return NextResponse.json(
        { error: 'Invalid fontSize value. Must be: small, medium, or large' },
        { status: 400 }
      );
    }

    const updateData: {
      theme?: string;
      fontSize?: string;
      reducedMotion?: boolean;
      highContrast?: boolean;
    } = {};

    if (theme) {
      updateData.theme = theme;
    }
    if (fontSize) {
      updateData.fontSize = fontSize;
    }
    if (typeof reducedMotion === 'boolean') {
      updateData.reducedMotion = reducedMotion;
    }
    if (typeof highContrast === 'boolean') {
      updateData.highContrast = highContrast;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        theme: true,
        fontSize: true,
        reducedMotion: true,
        highContrast: true,
      },
    });

    return NextResponse.json({
      theme: updated.theme,
      fontSize: updated.fontSize,
      reducedMotion: updated.reducedMotion,
      highContrast: updated.highContrast,
    });
  } catch (error) {
    console.error('Update appearance preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update appearance preferences' },
      { status: 500 }
    );
  }
}
