import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Get single boost
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const boost = await prisma.boost.findFirst({
      where: { id, userId },
      include: {
        post: {
          select: {
            id: true,
            contentType: true,
            description: true,
            mediaUrl: true,
            mediaThumbnailUrl: true,
            likesCount: true,
            viewsCount: true,
          },
        },
      },
    });

    if (!boost) {
      return NextResponse.json({ error: 'Boost not found' }, { status: 404 });
    }

    return NextResponse.json({
      boost: {
        id: boost.id,
        post_id: boost.postId,
        budget_cents: boost.budgetCents,
        spent_cents: boost.spentCents,
        impressions: boost.impressions,
        clicks: boost.clicks,
        status: boost.status,
        target_countries: boost.targetCountries,
        start_date: boost.startDate,
        end_date: boost.endDate,
        created_at: boost.createdAt,
        post: boost.post,
      },
    });
  } catch (error) {
    console.error('Get boost error:', error);
    return NextResponse.json(
      { error: 'Failed to get boost' },
      { status: 500 }
    );
  }
}

// Pause/resume/cancel boost
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { action } = await request.json();

    const boost = await prisma.boost.findFirst({
      where: { id, userId },
    });

    if (!boost) {
      return NextResponse.json({ error: 'Boost not found' }, { status: 404 });
    }

    let newStatus: string;

    switch (action) {
      case 'pause':
        if (boost.status !== 'active') {
          return NextResponse.json(
            { error: 'Can only pause active boosts' },
            { status: 400 }
          );
        }
        newStatus = 'paused';
        break;
      case 'resume':
        if (boost.status !== 'paused') {
          return NextResponse.json(
            { error: 'Can only resume paused boosts' },
            { status: 400 }
          );
        }
        newStatus = 'active';
        break;
      case 'cancel':
        if (!['active', 'paused'].includes(boost.status)) {
          return NextResponse.json(
            { error: 'Cannot cancel this boost' },
            { status: 400 }
          );
        }
        newStatus = 'cancelled';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updated = await prisma.boost.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      boost: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Update boost error:', error);
    return NextResponse.json(
      { error: 'Failed to update boost' },
      { status: 500 }
    );
  }
}
