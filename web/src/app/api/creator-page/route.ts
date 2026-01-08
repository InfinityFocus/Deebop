import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessCreatorPage, validateBlockLimits, validateUrl } from '@/lib/creator-page-limits';

// GET /api/creator-page - Get own creator page (draft + blocks)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier eligibility
    if (!canAccessCreatorPage(user.tier)) {
      return NextResponse.json(
        { error: 'Creator Page requires Standard or Pro tier' },
        { status: 403 }
      );
    }

    // Find or create creator page
    let page = await prisma.creatorPage.findUnique({
      where: { userId: user.id },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Create empty draft if doesn't exist
    if (!page) {
      page = await prisma.creatorPage.create({
        data: {
          userId: user.id,
          status: 'draft',
        },
        include: {
          blocks: true,
        },
      });
    }

    return NextResponse.json({
      page: {
        id: page.id,
        status: page.status,
        themeId: page.themeId,
        hideBranding: page.hideBranding,
        publishedAt: page.publishedAt?.toISOString() || null,
        blocks: page.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          sortOrder: block.sortOrder,
          data: block.data,
        })),
      },
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error('Get creator page error:', error);
    return NextResponse.json({ error: 'Failed to fetch creator page' }, { status: 500 });
  }
}

// PUT /api/creator-page - Save draft (blocks + theme)
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { blocks, themeId, hideBranding } = body;

    // Validate blocks array
    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Blocks must be an array' }, { status: 400 });
    }

    // Validate block limits
    const limitsCheck = validateBlockLimits(blocks, user.tier);
    if (!limitsCheck.valid) {
      return NextResponse.json({ error: limitsCheck.error }, { status: 400 });
    }

    // Validate all URLs in blocks
    for (const block of blocks) {
      const urlsToValidate: string[] = [];

      switch (block.type) {
        case 'hero':
          if (block.data?.ctaUrl) urlsToValidate.push(block.data.ctaUrl);
          break;
        case 'card':
        case 'affiliate_card':
          if (block.data?.ctaUrl) urlsToValidate.push(block.data.ctaUrl);
          break;
        case 'links':
          for (const group of block.data?.groups || []) {
            for (const link of group.links || []) {
              if (link.url) urlsToValidate.push(link.url);
            }
          }
          break;
        case 'social_links':
          for (const link of block.data?.links || []) {
            if (link.url) urlsToValidate.push(link.url);
          }
          break;
      }

      for (const url of urlsToValidate) {
        const urlCheck = validateUrl(url);
        if (!urlCheck.valid) {
          return NextResponse.json({ error: urlCheck.error }, { status: 400 });
        }
      }
    }

    // Check hide branding permission (Pro only)
    const canHide = user.tier === 'pro';
    const actualHideBranding = canHide ? (hideBranding ?? false) : false;

    // Find or create page
    let page = await prisma.creatorPage.findUnique({
      where: { userId: user.id },
    });

    if (!page) {
      page = await prisma.creatorPage.create({
        data: {
          userId: user.id,
          status: 'draft',
          themeId: themeId || null,
          hideBranding: actualHideBranding,
        },
      });
    } else {
      // Update page settings
      page = await prisma.creatorPage.update({
        where: { id: page.id },
        data: {
          themeId: themeId || null,
          hideBranding: actualHideBranding,
        },
      });
    }

    // Delete existing blocks and recreate (simpler than diffing)
    await prisma.creatorPageBlock.deleteMany({
      where: { pageId: page.id },
    });

    // Create new blocks
    if (blocks.length > 0) {
      await prisma.creatorPageBlock.createMany({
        data: blocks.map((block: { type: string; data: unknown }, index: number) => ({
          pageId: page.id,
          type: block.type,
          sortOrder: index,
          data: block.data || {},
        })),
      });
    }

    // Fetch updated page with blocks
    const updatedPage = await prisma.creatorPage.findUnique({
      where: { id: page.id },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: updatedPage!.id,
        status: updatedPage!.status,
        themeId: updatedPage!.themeId,
        hideBranding: updatedPage!.hideBranding,
        publishedAt: updatedPage!.publishedAt?.toISOString() || null,
        blocks: updatedPage!.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          sortOrder: block.sortOrder,
          data: block.data,
        })),
      },
    });
  } catch (error) {
    console.error('Save creator page error:', error);
    return NextResponse.json({ error: 'Failed to save creator page' }, { status: 500 });
  }
}
