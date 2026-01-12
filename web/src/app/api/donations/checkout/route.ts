import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { getStripe, isStripeEnabled } from '@/lib/stripe';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Min £1 (100 pence), Max £100 (10000 pence)
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 10000;

export async function POST(request: NextRequest) {
  try {
    // Check if payments are enabled
    if (!isStripeEnabled()) {
      return NextResponse.json(
        { error: 'Payments are disabled in beta mode' },
        { status: 503 }
      );
    }

    // Get user from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { amountPence } = await request.json();

    // Validate amount
    if (!amountPence || typeof amountPence !== 'number') {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (amountPence < MIN_AMOUNT || amountPence > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Amount must be between £${MIN_AMOUNT / 100} and £${MAX_AMOUNT / 100}` },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Save customer ID to user
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create one-time payment checkout session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: {
              name: 'Support Deebop',
              description: 'Thank you for supporting our platform!',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?donation=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?donation=canceled`,
      metadata: {
        type: 'donation',
        userId: user.id,
        amountPence: amountPence.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Donation checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
