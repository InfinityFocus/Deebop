import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Track ad click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type } = await request.json();

    if (type === 'boost') {
      // Track boost click
      const boost = await prisma.boost.update({
        where: { id },
        data: {
          clicks: { increment: 1 },
          // Charge per click (e.g., 5 pence per click)
          spentCents: { increment: 5 },
        },
      });

      // Check if budget exhausted
      if (boost.spentCents >= boost.budgetCents) {
        await prisma.boost.update({
          where: { id },
          data: { status: 'completed' },
        });
      }

      return NextResponse.json({ success: true });
    }

    // Track regular ad click
    await prisma.ad.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
