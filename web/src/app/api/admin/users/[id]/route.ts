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

// Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        profileLink: true,
        tier: true,
        isPrivate: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        stripeCustomerId: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            likes: true,
            reports: true,
            boosts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.displayName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
        profile_link: user.profileLink,
        tier: user.tier,
        is_private: user.isPrivate,
        is_suspended: user.isSuspended,
        suspended_at: user.suspendedAt,
        suspended_reason: user.suspendedReason,
        stripe_customer_id: user.stripeCustomerId,
        followers_count: user.followersCount,
        following_count: user.followingCount,
        posts_count: user.postsCount,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        counts: {
          posts: user._count.posts,
          likes: user._count.likes,
          reports: user._count.reports,
          boosts: user._count.boosts,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// Update user (tier, suspension status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, tier, reason } = body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying admin accounts
    if (ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: 'Cannot modify admin accounts' },
        { status: 403 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'suspend':
        updateData = {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: reason || 'Suspended by admin',
        };
        break;

      case 'unsuspend':
        updateData = {
          isSuspended: false,
          suspendedAt: null,
          suspendedReason: null,
        };
        break;

      case 'change_tier':
        if (!['free', 'standard', 'pro'].includes(tier)) {
          return NextResponse.json(
            { error: 'Invalid tier' },
            { status: 400 }
          );
        }
        updateData = { tier };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        tier: true,
        isSuspended: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        tier: updatedUser.tier,
        is_suspended: updatedUser.isSuspended,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting admin accounts
    if (ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 403 }
      );
    }

    // Delete user (cascades to posts, likes, etc.)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `User @${user.username} deleted`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
