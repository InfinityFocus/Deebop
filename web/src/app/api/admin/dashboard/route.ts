import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all stats in parallel
    const [
      pendingReports,
      totalReports,
      activeAds,
      totalAds,
      totalUsers,
      suspendedUsers,
      totalPosts,
    ] = await Promise.all([
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count(),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.ad.count(),
      prisma.user.count(),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.post.count(),
    ]);

    return NextResponse.json({
      pendingReports,
      totalReports,
      activeAds,
      totalAds,
      totalUsers,
      suspendedUsers,
      totalPosts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
