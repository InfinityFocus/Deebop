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

// Get single ad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json({
      ad: {
        id: ad.id,
        image_url: ad.imageUrl,
        headline: ad.headline,
        destination_url: ad.destinationUrl,
        is_active: ad.isActive,
        impressions: ad.impressions,
        clicks: ad.clicks,
        frequency_free: ad.frequencyFree,
        frequency_standard: ad.frequencyStandard,
        feed_target: ad.feedTarget,
        created_at: ad.createdAt,
      },
    });
  } catch (error) {
    console.error('Get ad error:', error);
    return NextResponse.json(
      { error: 'Failed to get ad' },
      { status: 500 }
    );
  }
}

// Update ad
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      imageUrl,
      headline,
      destinationUrl,
      isActive,
      frequencyFree,
      frequencyStandard,
      feedTarget,
    } = await request.json();

    // Validate feedTarget if provided
    if (feedTarget !== undefined && !['discovery', 'following', 'both'].includes(feedTarget)) {
      return NextResponse.json(
        { error: 'Invalid feed target. Must be "discovery", "following", or "both"' },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: {
        ...(imageUrl !== undefined && { imageUrl }),
        ...(headline !== undefined && { headline }),
        ...(destinationUrl !== undefined && { destinationUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(frequencyFree !== undefined && { frequencyFree: Math.max(1, frequencyFree) }),
        ...(frequencyStandard !== undefined && { frequencyStandard: Math.max(1, frequencyStandard) }),
        ...(feedTarget !== undefined && { feedTarget }),
      },
    });

    return NextResponse.json({
      ad: {
        id: ad.id,
        image_url: ad.imageUrl,
        headline: ad.headline,
        destination_url: ad.destinationUrl,
        is_active: ad.isActive,
        frequency_free: ad.frequencyFree,
        frequency_standard: ad.frequencyStandard,
        feed_target: ad.feedTarget,
      },
    });
  } catch (error) {
    console.error('Update ad error:', error);
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    );
  }
}

// Delete ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.ad.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete ad error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
