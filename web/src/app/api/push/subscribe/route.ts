import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

async function getUser(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get user agent for device identification
    const userAgent = request.headers.get('user-agent') || undefined;

    // Upsert subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        userId: user.userId,
      },
      create: {
        userId: user.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    // Enable push for user
    await prisma.user.update({
      where: { id: user.userId },
      data: { pushEnabled: true },
    });

    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      // Delete specific subscription
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: user.userId,
          endpoint,
        },
      });
    } else {
      // Delete all subscriptions for user
      await prisma.pushSubscription.deleteMany({
        where: { userId: user.userId },
      });
    }

    // Check if user has any remaining subscriptions
    const remainingCount = await prisma.pushSubscription.count({
      where: { userId: user.userId },
    });

    // Disable push if no subscriptions left
    if (remainingCount === 0) {
      await prisma.user.update({
        where: { id: user.userId },
        data: { pushEnabled: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { pushEnabled: true },
    });

    return NextResponse.json({
      pushEnabled: userData?.pushEnabled || false,
      subscriptions,
    });
  } catch (error) {
    console.error('Error getting push status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
