import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/interests - List all interests grouped by category
export async function GET() {
  try {
    const interests = await prisma.interest.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Group by category, only include parent interests
    const parentInterests = interests.filter((i) => !i.parentId);

    const grouped = parentInterests.reduce(
      (acc, interest) => {
        if (!acc[interest.category]) {
          acc[interest.category] = [];
        }
        acc[interest.category].push({
          id: interest.id,
          name: interest.name,
          slug: interest.slug,
          iconEmoji: interest.iconEmoji,
          children: interest.children.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            iconEmoji: child.iconEmoji,
          })),
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{
          id: string;
          name: string;
          slug: string;
          iconEmoji: string | null;
          children: Array<{
            id: string;
            name: string;
            slug: string;
            iconEmoji: string | null;
          }>;
        }>
      >
    );

    return NextResponse.json({ interests: grouped });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
}
