import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessCreatorPage, getLimitsForTier } from '@/lib/creator-page-limits';

// GET /api/creator-page/analytics - Get analytics for own page
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessCreatorPage(user.tier)) {
      return NextResponse.json(
        { error: 'Creator Page requires Standard or Pro tier' },
        { status: 403 }
      );
    }

    const limits = getLimitsForTier(user.tier);
    if (!limits) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 403 }
      );
    }

    // Find page
    const page = await prisma.creatorPage.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json({
        views: { total: 0, last7Days: 0, last30Days: 0 },
        clicks: { total: 0, last7Days: 0, last30Days: 0 },
        topLinks: [],
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get view counts
    const [totalViews, views7Days, views30Days] = await Promise.all([
      prisma.creatorPageView.count({ where: { pageId: page.id } }),
      prisma.creatorPageView.count({
        where: { pageId: page.id, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.creatorPageView.count({
        where: { pageId: page.id, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Get click counts
    const [totalClicks, clicks7Days, clicks30Days] = await Promise.all([
      prisma.creatorPageClick.count({ where: { pageId: page.id } }),
      prisma.creatorPageClick.count({
        where: { pageId: page.id, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.creatorPageClick.count({
        where: { pageId: page.id, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Get top clicked blocks (last 30 days)
    const topClicksRaw = await prisma.creatorPageClick.groupBy({
      by: ['blockId', 'linkIndex'],
      where: {
        pageId: page.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch block data to get labels
    const blockIds = [...new Set(topClicksRaw.map((c) => c.blockId))];
    const blocks = await prisma.creatorPageBlock.findMany({
      where: { id: { in: blockIds } },
      select: { id: true, type: true, data: true },
    });

    const blockMap = new Map(blocks.map((b) => [b.id, b]));

    // Get email signup count
    const emailCount = await prisma.creatorPageEmail.count({
      where: { pageId: page.id },
    });

    const topLinks = topClicksRaw.map((click) => {
      const block = blockMap.get(click.blockId);
      let label = 'Unknown';

      if (block) {
        const data = block.data as Record<string, unknown>;

        switch (block.type) {
          case 'hero':
            label = (data.ctaLabel as string) || 'Hero CTA';
            break;
          case 'card':
          case 'affiliate_card':
            label = (data.title as string) || 'Card';
            break;
          case 'links': {
            // Find the specific link by index
            const groups = (data.groups as Array<{ links: Array<{ label: string }> }>) || [];
            let linkCounter = 0;
            for (const group of groups) {
              for (const link of group.links || []) {
                if (linkCounter === click.linkIndex) {
                  label = link.label || 'Link';
                  break;
                }
                linkCounter++;
              }
            }
            break;
          }
          case 'social_links': {
            const links = (data.links as Array<{ platform: string }>) || [];
            if (click.linkIndex !== null && links[click.linkIndex]) {
              label = links[click.linkIndex].platform;
            } else {
              label = 'Social Link';
            }
            break;
          }
          case 'featured_content': {
            label = 'Featured Content';
            break;
          }
          default:
            label = block.type;
        }
      }

      const result: {
        blockId: string;
        linkIndex: number | null;
        label: string;
        clicks: number;
        ctr?: number;
      } = {
        blockId: click.blockId,
        linkIndex: click.linkIndex,
        label,
        clicks: click._count.id,
      };

      // Add CTR for Pro users
      if (limits.canViewCtr && views30Days > 0) {
        result.ctr = Math.round((click._count.id / views30Days) * 10000) / 100;
      }

      return result;
    });

    // Get top referrers for Pro users
    let topReferrers: Array<{ referrer: string; count: number }> | undefined;

    if (limits.canViewReferrers) {
      const referrerData = await prisma.creatorPageView.groupBy({
        by: ['referrer'],
        where: {
          pageId: page.id,
          createdAt: { gte: thirtyDaysAgo },
          referrer: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      topReferrers = referrerData
        .filter((r) => r.referrer)
        .map((r) => ({
          referrer: r.referrer!,
          count: r._count.id,
        }));
    }

    return NextResponse.json({
      analytics: {
        views: {
          total: totalViews,
          last7Days: views7Days,
          last30Days: views30Days,
        },
        clicks: {
          total: totalClicks,
          last7Days: clicks7Days,
          last30Days: clicks30Days,
        },
        topLinks,
        ...(topReferrers && { topReferrers }),
      },
      tier: user.tier,
      emailCount,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
