import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Get user's boosts
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const boosts = await prisma.boost.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            contentType: true,
            textContent: true,
            mediaUrl: true,
            mediaThumbnailUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      boosts: boosts.map((b) => ({
        id: b.id,
        post_id: b.postId,
        budget_cents: b.budgetCents,
        spent_cents: b.spentCents,
        impressions: b.impressions,
        clicks: b.clicks,
        status: b.status,
        target_countries: b.targetCountries,
        start_date: b.startDate,
        end_date: b.endDate,
        created_at: b.createdAt,
        post: {
          id: b.post.id,
          content_type: b.post.contentType,
          text_content: b.post.textContent,
          media_url: b.post.mediaUrl,
          media_thumbnail_url: b.post.mediaThumbnailUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Get boosts error:', error);
    return NextResponse.json(
      { error: 'Failed to get boosts' },
      { status: 500 }
    );
  }
}

// Create a new boost (with Stripe payment)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { postId, budgetPounds, targetCountries, durationDays } = await request.json();

    if (!postId || !budgetPounds) {
      return NextResponse.json(
        { error: 'Post ID and budget are required' },
        { status: 400 }
      );
    }

    // Validate budget (minimum £5, maximum £500)
    const budgetCents = Math.round(budgetPounds * 100);
    if (budgetCents < 500 || budgetCents > 50000) {
      return NextResponse.json(
        { error: 'Budget must be between £5 and £500' },
        { status: 400 }
      );
    }

    // Verify user owns the post
    const post = await prisma.post.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found or not owned by user' },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Calculate end date
    const endDate = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    // Create the boost record (pending payment)
    const boost = await prisma.boost.create({
      data: {
        postId,
        userId,
        budgetCents,
        targetCountries: targetCountries || [],
        status: 'pending_payment',
        endDate,
      },
    });

    // Create Stripe checkout session for the boost
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Post Boost',
              description: `Boost your post with £${budgetPounds} budget`,
            },
            unit_amount: budgetCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/boosts?success=true&boost_id=${boost.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/boosts?canceled=true`,
      metadata: {
        type: 'boost',
        boostId: boost.id,
        userId,
        postId,
      },
    });

    return NextResponse.json({
      boost_id: boost.id,
      checkout_url: session.url,
    });
  } catch (error) {
    console.error('Create boost error:', error);
    return NextResponse.json(
      { error: 'Failed to create boost' },
      { status: 500 }
    );
  }
}
