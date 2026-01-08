import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { canAccessCreatorPage } from '@/lib/creator-page-limits';

// GET /api/creator-page/email-signups/export - Export email signups as CSV
export async function GET() {
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
      select: { id: true },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'No creator page found' },
        { status: 404 }
      );
    }

    // Fetch all signups
    const signups = await prisma.creatorPageEmail.findMany({
      where: { pageId: page.id },
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        consentText: true,
        createdAt: true,
      },
    });

    // Generate CSV
    const headers = ['Email', 'Consent Text', 'Signed Up At'];
    const rows = signups.map((signup) => [
      signup.email,
      `"${signup.consentText.replace(/"/g, '""')}"`, // Escape quotes in CSV
      signup.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Return as downloadable CSV
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="email-signups-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export signups error:', error);
    return NextResponse.json({ error: 'Failed to export signups' }, { status: 500 });
  }
}
