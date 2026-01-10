import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/favourites/settings - Public endpoint
// Returns whether favourites feature is enabled (no auth required)
export async function GET() {
  try {
    let settings = await prisma.favouritesSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.favouritesSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      isEnabled: settings.isEnabled,
    });
  } catch (error) {
    console.error('Get public favourites settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get favourites settings' },
      { status: 500 }
    );
  }
}
