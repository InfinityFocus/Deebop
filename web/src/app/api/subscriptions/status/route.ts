import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { getStripe, isStripeEnabled } from '@/lib/stripe';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subscription = null;

    // If user has Stripe customer ID and Stripe is enabled, get subscription details
    if (user.stripeCustomerId && isStripeEnabled()) {
      const subscriptions = await getStripe().subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        // Access billing cycle anchor or items for period end
        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
        subscription = {
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }
    }

    return NextResponse.json({
      tier: user.tier,
      subscription,
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
