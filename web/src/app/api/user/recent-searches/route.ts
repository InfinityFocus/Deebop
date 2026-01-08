import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// GET /api/user/recent-searches - Get recent searches
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searches = await prisma.recentSearch.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        query: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent searches' },
      { status: 500 }
    );
  }
}

// POST /api/user/recent-searches - Add a search to history
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, type = 'all' } = body as { query: string; type?: string };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const validTypes = ['all', 'hashtag', 'creator', 'album', 'event', 'shout'];
    const searchType = validTypes.includes(type) ? type : 'all';

    // Check if this exact search already exists
    const existing = await prisma.recentSearch.findFirst({
      where: {
        userId: user.userId,
        query: query.trim(),
        type: searchType,
      },
    });

    if (existing) {
      // Update timestamp to make it most recent
      await prisma.recentSearch.update({
        where: { id: existing.id },
        data: { createdAt: new Date() },
      });
    } else {
      // Create new search entry
      await prisma.recentSearch.create({
        data: {
          userId: user.userId,
          query: query.trim(),
          type: searchType,
        },
      });

      // Clean up old searches (keep only 20 most recent)
      const oldSearches = await prisma.recentSearch.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        select: { id: true },
      });

      if (oldSearches.length > 0) {
        await prisma.recentSearch.deleteMany({
          where: {
            id: { in: oldSearches.map((s) => s.id) },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/recent-searches - Clear search history
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.recentSearch.deleteMany({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Search history cleared',
    });
  } catch (error) {
    console.error('Error clearing search history:', error);
    return NextResponse.json(
      { error: 'Failed to clear search history' },
      { status: 500 }
    );
  }
}
