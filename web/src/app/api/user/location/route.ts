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

// GET /api/user/location - Get user's selected city
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLocation = await prisma.userLocation.findUnique({
      where: { userId: user.userId },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            countryName: true,
          },
        },
      },
    });

    return NextResponse.json({
      location: userLocation
        ? {
            cityId: userLocation.cityId,
            city: userLocation.city,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching user location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user location' },
      { status: 500 }
    );
  }
}

// POST /api/user/location - Set user's city
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cityId } = body as { cityId: string | null };

    // If cityId is null, remove location
    if (cityId === null) {
      await prisma.userLocation.deleteMany({
        where: { userId: user.userId },
      });
      return NextResponse.json({
        location: null,
        message: 'Location removed',
      });
    }

    // Verify city exists
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        countryCode: true,
        countryName: true,
      },
    });

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Upsert user location
    const userLocation = await prisma.userLocation.upsert({
      where: { userId: user.userId },
      update: { cityId },
      create: {
        userId: user.userId,
        cityId,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            countryName: true,
          },
        },
      },
    });

    return NextResponse.json({
      location: {
        cityId: userLocation.cityId,
        city: userLocation.city,
      },
      message: 'Location updated',
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
