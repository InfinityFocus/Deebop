import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessCreatorPage, validateBlockLimits } from '@/lib/creator-page-limits';

// POST /api/creator-page/publish - Publish the creator page
export async function POST() {
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

    // Find page
    const page = await prisma.creatorPage.findUnique({
      where: { userId: user.id },
      include: {
        blocks: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'No creator page found. Create one first.' },
        { status: 404 }
      );
    }

    // Validate blocks before publishing
    const limitsCheck = validateBlockLimits(
      page.blocks.map((b) => ({ type: b.type, data: b.data })),
      user.tier
    );
    if (!limitsCheck.valid) {
      return NextResponse.json({ error: limitsCheck.error }, { status: 400 });
    }

    // Must have at least one block to publish
    if (page.blocks.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one block before publishing' },
        { status: 400 }
      );
    }

    // Update status to published
    const updatedPage = await prisma.creatorPage.update({
      where: { id: page.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedPage.status,
      publishedAt: updatedPage.publishedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Publish creator page error:', error);
    return NextResponse.json({ error: 'Failed to publish creator page' }, { status: 500 });
  }
}

// DELETE /api/creator-page/publish - Unpublish the creator page
export async function DELETE() {
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

    // Find page
    const page = await prisma.creatorPage.findUnique({
      where: { userId: user.id },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'No creator page found' },
        { status: 404 }
      );
    }

    // Update status to draft
    const updatedPage = await prisma.creatorPage.update({
      where: { id: page.id },
      data: {
        status: 'draft',
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedPage.status,
    });
  } catch (error) {
    console.error('Unpublish creator page error:', error);
    return NextResponse.json({ error: 'Failed to unpublish creator page' }, { status: 500 });
  }
}
