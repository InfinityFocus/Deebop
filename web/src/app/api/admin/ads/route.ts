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

// List all ads
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ads: ads.map((ad) => ({
        id: ad.id,
        image_url: ad.imageUrl,
        headline: ad.headline,
        destination_url: ad.destinationUrl,
        is_active: ad.isActive,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00',
        frequency_free: ad.frequencyFree,
        frequency_standard: ad.frequencyStandard,
        feed_target: ad.feedTarget,
        created_at: ad.createdAt,
      })),
    });
  } catch (error) {
    console.error('List ads error:', error);
    return NextResponse.json(
      { error: 'Failed to list ads' },
      { status: 500 }
    );
  }
}

// Create new ad
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      imageUrl,
      headline,
      destinationUrl,
      frequencyFree = 5,
      frequencyStandard = 10,
      feedTarget = 'both',
    } = await request.json();

    if (!imageUrl || !headline || !destinationUrl) {
      return NextResponse.json(
        { error: 'Image URL, headline, and destination URL are required' },
        { status: 400 }
      );
    }

    // Validate feedTarget
    if (!['discovery', 'following', 'both'].includes(feedTarget)) {
      return NextResponse.json(
        { error: 'Invalid feed target. Must be "discovery", "following", or "both"' },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.create({
      data: {
        imageUrl,
        headline,
        destinationUrl,
        frequencyFree: Math.max(1, frequencyFree),
        frequencyStandard: Math.max(1, frequencyStandard),
        feedTarget,
        isActive: true,
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
    console.error('Create ad error:', error);
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    );
  }
}
