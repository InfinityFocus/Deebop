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

interface EventData {
  ctaName?: string;
  depth?: number;
  source?: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('deebop-auth')?.value;

    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get days parameter (default 7)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const validDays = [7, 14, 30].includes(days) ? days : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all events in the date range
    const events = await prisma.homepageEvent.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        sessionId: true,
        eventType: true,
        eventData: true,
        referrer: true,
        createdAt: true,
      },
    });

    // Calculate summary stats
    const viewEvents = events.filter(e => e.eventType === 'homepage_view');
    const totalViews = viewEvents.length;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;

    // Calculate CTA clicks
    const ctaEvents = events.filter(e => e.eventType === 'cta_click');
    const ctaClicks = {
      explore: 0,
      create_account: 0,
      sign_in: 0,
      create_event: 0,
      build_creator_page: 0,
      features: 0,
    };

    ctaEvents.forEach(e => {
      const data = e.eventData as EventData | null;
      const ctaName = data?.ctaName;
      if (ctaName && ctaName in ctaClicks) {
        ctaClicks[ctaName as keyof typeof ctaClicks]++;
      }
    });

    // Calculate scroll depth stats
    const scrollEvents = events.filter(e => e.eventType === 'scroll_depth');
    const scrollDepth = {
      reached25: 0,
      reached50: 0,
      reached75: 0,
      reached100: 0,
    };

    // Group scroll events by session to get max depth per session
    const sessionScrollDepths = new Map<string, number>();
    scrollEvents.forEach(e => {
      const data = e.eventData as EventData | null;
      const depth = data?.depth;
      if (depth) {
        const currentMax = sessionScrollDepths.get(e.sessionId) || 0;
        if (depth > currentMax) {
          sessionScrollDepths.set(e.sessionId, depth);
        }
      }
    });

    // Count sessions that reached each depth
    sessionScrollDepths.forEach(maxDepth => {
      if (maxDepth >= 25) scrollDepth.reached25++;
      if (maxDepth >= 50) scrollDepth.reached50++;
      if (maxDepth >= 75) scrollDepth.reached75++;
      if (maxDepth >= 100) scrollDepth.reached100++;
    });

    // Calculate average scroll depth
    const totalScrollDepth = Array.from(sessionScrollDepths.values()).reduce((sum, d) => sum + d, 0);
    const avgScrollDepth = sessionScrollDepths.size > 0
      ? Math.round(totalScrollDepth / sessionScrollDepths.size)
      : 0;

    // Calculate daily views
    const dailyViews: { date: string; views: number }[] = [];
    const dayMap = new Map<string, number>();

    viewEvents.forEach(e => {
      const dateStr = e.createdAt.toISOString().split('T')[0];
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
    });

    // Fill in all days in range (including today)
    for (let i = 0; i <= validDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyViews.push({
        date: dateStr,
        views: dayMap.get(dateStr) || 0,
      });
    }

    // Calculate top referrers
    const referrerMap = new Map<string, number>();
    viewEvents.forEach(e => {
      const ref = e.referrer || 'Direct';
      // Extract domain from referrer URL
      let domain = 'Direct';
      if (e.referrer) {
        try {
          const url = new URL(e.referrer);
          domain = url.hostname;
        } catch {
          domain = e.referrer;
        }
      }
      referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
    });

    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate conversion rate (create_account clicks / views * 100)
    const conversionRate = totalViews > 0
      ? Math.round((ctaClicks.create_account / totalViews) * 10000) / 100
      : 0;

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueSessions,
        avgScrollDepth,
      },
      ctaClicks,
      scrollDepth,
      dailyViews,
      topReferrers,
      conversionRate,
    });
  } catch (error) {
    console.error('Homepage analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
