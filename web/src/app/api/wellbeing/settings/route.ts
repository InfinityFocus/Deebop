import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public endpoint - no auth required
// Returns doom scroll settings for client-side use
export async function GET() {
  try {
    let settings = await prisma.doomScrollSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.doomScrollSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      isEnabled: settings.isEnabled,
      postsThreshold: settings.postsThreshold,
      timeThresholdSeconds: settings.timeThresholdSeconds,
      breakDurationSeconds: settings.breakDurationSeconds,
      title: settings.title,
      message: settings.message,
    });
  } catch (error) {
    console.error('Get public wellbeing settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get wellbeing settings' },
      { status: 500 }
    );
  }
}
