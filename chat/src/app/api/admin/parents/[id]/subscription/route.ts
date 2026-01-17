import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import {
  getSubscriptionByParentId,
  grantFreeAccount,
  revokeFreeAccount,
} from '@/lib/db';
import { subscriptionFromDB } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/parents/[id]/subscription - Get parent's subscription
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: parentId } = await context.params;
    const subscription = await getSubscriptionByParentId(parentId);

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
    console.error('Admin subscription fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/parents/[id]/subscription - Grant free account
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: parentId } = await context.params;
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Grant free account (grantedBy is "admin" for now, can be enhanced later)
    const subscription = await grantFreeAccount(parentId, 'admin', reason.trim());

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Failed to grant free account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptionFromDB(subscription),
    });
  } catch (error) {
    console.error('Admin grant free account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/parents/[id]/subscription - Revoke free account
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: parentId } = await context.params;

    // Get subscription first
    const subscription = await getSubscriptionByParentId(parentId);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.is_free_account) {
      return NextResponse.json(
        { success: false, error: 'This is not a free account' },
        { status: 400 }
      );
    }

    // Revoke free account
    const updated = await revokeFreeAccount(subscription.id);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to revoke free account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptionFromDB(updated),
    });
  } catch (error) {
    console.error('Admin revoke free account error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
