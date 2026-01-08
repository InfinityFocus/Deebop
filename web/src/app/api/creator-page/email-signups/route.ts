import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/creator-page/email-signups - Capture email signup (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, email, consentText } = body;

    if (!pageId || !email || !consentText) {
      return NextResponse.json(
        { error: 'pageId, email, and consentText are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Verify page exists and is published
    const page = await prisma.creatorPage.findUnique({
      where: { id: pageId },
      select: { id: true, status: true },
    });

    if (!page || page.status !== 'published') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if already signed up (upsert to avoid duplicates)
    const existing = await prisma.creatorPageEmail.findUnique({
      where: {
        pageId_email: { pageId, email: email.toLowerCase() },
      },
    });

    if (existing) {
      // Already signed up - return success without creating duplicate
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    // Create signup record
    await prisma.creatorPageEmail.create({
      data: {
        pageId,
        email: email.toLowerCase(),
        consentText,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email signup error:', error);
    return NextResponse.json({ error: 'Failed to capture email' }, { status: 500 });
  }
}
