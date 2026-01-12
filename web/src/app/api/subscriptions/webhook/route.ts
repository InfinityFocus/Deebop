import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe, isStripeEnabled } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Check if payments are enabled
  if (!isStripeEnabled()) {
    return NextResponse.json(
      { error: 'Stripe webhooks are disabled in beta mode' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const type = session.metadata?.type;

  // Handle boost payment
  if (type === 'boost') {
    const boostId = session.metadata?.boostId;
    if (boostId) {
      await prisma.boost.update({
        where: { id: boostId },
        data: { status: 'active' },
      });
      console.log(`Boost ${boostId} activated`);
    }
    return;
  }

  // Handle donation payment (one-time)
  if (type === 'donation') {
    const userId = session.metadata?.userId;
    const amountPence = parseInt(session.metadata?.amountPence || '0');
    console.log(`[Donation] User ${userId} donated ${amountPence} pence`);
    // No tier change needed for donations - just a thank you
    return;
  }

  // Handle subscription payment
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'standard' | 'pro';

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: { tier },
  });

  console.log(`User ${userId} upgraded to ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier as 'standard' | 'pro';

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Check if subscription is active
  if (subscription.status === 'active') {
    await prisma.user.update({
      where: { id: userId },
      data: { tier: tier || 'standard' },
    });
    console.log(`Subscription active for user ${userId}, tier: ${tier}`);
  } else if (['past_due', 'unpaid'].includes(subscription.status)) {
    // Keep tier but could add a flag for grace period
    console.log(`Subscription ${subscription.status} for user ${userId}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: 'free' },
      });
      console.log(`User ${user.id} downgraded to free (subscription deleted)`);
    }
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tier: 'free' },
  });
  console.log(`User ${userId} downgraded to free (subscription deleted)`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    // Could send notification, add grace period flag, etc.
    console.log(`Payment failed for user ${user.id}`);
  }
}
