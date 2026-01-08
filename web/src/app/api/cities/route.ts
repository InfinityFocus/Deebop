import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/cities - Search/list cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const country = searchParams.get('country');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {};

    if (query) {
      where.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (country) {
      where.countryCode = country;
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: [{ population: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        countryCode: true,
        countryName: true,
        population: true,
      },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
