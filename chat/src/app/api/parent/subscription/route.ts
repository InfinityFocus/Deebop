import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getSubscriptionByParentId,
  createTrialSubscription,
  createSubscription,
  cancelSubscription,
  updateSubscription,
} from '@/lib/db';
import { subscriptionFromDB, type SubscriptionPlan } from '@/types';

// GET /api/parent/subscription - Get current subscription
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await getSubscriptionByParentId(user.id);

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: subscriptionFromDB(subscription),
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/parent/subscription - Create subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, startTrial } = body as { plan?: SubscriptionPlan; startTrial?: boolean };

    // Check if subscription already exists
    const existing = await getSubscriptionByParentId(user.id);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Subscription already exists' },
        { status: 400 }
      );
    }

    let subscription;

    if (startTrial) {
      // Create trial subscription
      subscription = await createTrialSubscription(user.id);
    } else if (plan) {
      // Create paid subscription (testing mode - auto-active)
      subscription = await createSubscription(user.id, plan);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either plan or startTrial is required' },
        { status: 400 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptionFromDB(subscription),
    });
  } catch (error) {
    console.error('Subscription create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/parent/subscription - Cancel or reactivate subscription
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.type !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body as { action: 'cancel' | 'reactivate' };

    const subscription = await getSubscriptionByParentId(user.id);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      // Cancel subscription
      const updated = await cancelSubscription(subscription.id);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: subscriptionFromDB(updated),
      });
    } else if (action === 'reactivate') {
      // Reactivate cancelled subscription (set status back to active)
      if (subscription.status !== 'cancelled') {
        return NextResponse.json(
          { success: false, error: 'Subscription is not cancelled' },
          { status: 400 }
        );
      }

      const updated = await updateSubscription(subscription.id, {
        status: 'active',
        cancelled_at: null,
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to reactivate subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: subscriptionFromDB(updated),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
