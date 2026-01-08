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

// GET /api/user/interests - Get current user's selected interests
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInterests = await prisma.userInterest.findMany({
      where: { userId: user.userId },
      include: {
        interest: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            iconEmoji: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      interests: userInterests.map((ui) => ui.interest),
    });
  } catch (error) {
    console.error('Error fetching user interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user interests' },
      { status: 500 }
    );
  }
}

// POST /api/user/interests - Set user interests (replace all)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interestIds } = body as { interestIds: string[] };

    // Validate we have an array
    if (!Array.isArray(interestIds)) {
      return NextResponse.json(
        { error: 'interestIds must be an array' },
        { status: 400 }
      );
    }

    // Validate count (5-10 interests required)
    if (interestIds.length < 5) {
      return NextResponse.json(
        { error: 'Please select at least 5 interests' },
        { status: 400 }
      );
    }

    if (interestIds.length > 10) {
      return NextResponse.json(
        { error: 'Please select at most 10 interests' },
        { status: 400 }
      );
    }

    // Verify all interest IDs exist
    const validInterests = await prisma.interest.findMany({
      where: { id: { in: interestIds } },
      select: { id: true },
    });

    if (validInterests.length !== interestIds.length) {
      return NextResponse.json(
        { error: 'One or more invalid interest IDs' },
        { status: 400 }
      );
    }

    // Replace user's interests in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing interests
      await tx.userInterest.deleteMany({
        where: { userId: user.userId },
      });

      // Create new interests
      await tx.userInterest.createMany({
        data: interestIds.map((interestId) => ({
          userId: user.userId,
          interestId,
        })),
      });
    });

    // Fetch and return the updated interests
    const userInterests = await prisma.userInterest.findMany({
      where: { userId: user.userId },
      include: {
        interest: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            iconEmoji: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      interests: userInterests.map((ui) => ui.interest),
      message: 'Interests updated successfully',
    });
  } catch (error) {
    console.error('Error updating user interests:', error);
    return NextResponse.json(
      { error: 'Failed to update interests' },
      { status: 500 }
    );
  }
}
