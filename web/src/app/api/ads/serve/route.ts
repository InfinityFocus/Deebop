import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Get an ad to display (for free/standard tier users)
export async function GET(request: NextRequest) {
  try {
    // Get feedMode from query params
    const { searchParams } = new URL(request.url);
    const feedMode = searchParams.get('feedMode') || 'discovery';

    // Check user tier - Pro users don't see ads
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    let userTier = 'free';

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { tier: true },
        });

        // Pro users don't see ads
        if (user?.tier === 'pro') {
          return NextResponse.json({ ad: null, reason: 'pro_user' });
        }

        userTier = user?.tier || 'free';
      } catch {
        // Invalid token, continue as anonymous (free tier)
      }
    }

    // First, try to get a boosted post
    const boost = await prisma.boost.findFirst({
      where: {
        status: 'active',
        spentCents: { lt: prisma.boost.fields.budgetCents },
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                tier: true,
              },
            },
          },
        },
      },
      orderBy: { impressions: 'asc' }, // Prioritize less-shown boosts
    });

    if (boost) {
      // Increment boost impressions
      await prisma.boost.update({
        where: { id: boost.id },
        data: { impressions: { increment: 1 } },
      });

      // Default frequency for boosts: 5 for free, 10 for standard
      const boostFrequency = userTier === 'standard' ? 10 : 5;

      return NextResponse.json({
        type: 'boost',
        boost: {
          id: boost.id,
          post: {
            id: boost.post.id,
            content_type: boost.post.contentType,
            text_content: boost.post.description,
            media_url: boost.post.mediaUrl,
            media_thumbnail_url: boost.post.mediaThumbnailUrl,
            likes_count: boost.post.likesCount,
            views_count: boost.post.viewsCount,
            created_at: boost.post.createdAt,
            author: {
              id: boost.post.user.id,
              username: boost.post.user.username,
              display_name: boost.post.user.displayName,
              avatar_url: boost.post.user.avatarUrl,
              tier: boost.post.user.tier,
            },
          },
        },
        frequency: boostFrequency,
      });
    }

    // Otherwise, get a random active ad that targets this feed mode
    // feedTarget must be 'both' or match the current feedMode
    const adWhereClause = {
      isActive: true,
      OR: [
        { feedTarget: 'both' },
        { feedTarget: feedMode },
      ],
    };

    const adsCount = await prisma.ad.count({ where: adWhereClause });

    if (adsCount === 0) {
      return NextResponse.json({ ad: null, reason: 'no_ads' });
    }

    const skip = Math.floor(Math.random() * adsCount);
    const ad = await prisma.ad.findFirst({
      where: adWhereClause,
      skip,
    });

    if (!ad) {
      return NextResponse.json({ ad: null, reason: 'no_ads' });
    }

    // Increment impressions
    await prisma.ad.update({
      where: { id: ad.id },
      data: { impressions: { increment: 1 } },
    });

    // Get frequency based on user tier
    const frequency = userTier === 'standard' ? ad.frequencyStandard : ad.frequencyFree;

    return NextResponse.json({
      type: 'ad',
      ad: {
        id: ad.id,
        image_url: ad.imageUrl,
        headline: ad.headline,
        destination_url: ad.destinationUrl,
      },
      frequency,
    });
  } catch (error) {
    console.error('Serve ad error:', error);
    return NextResponse.json({ ad: null, error: 'Failed to serve ad' });
  }
}
