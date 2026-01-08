import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';
import AdminLayoutClient from './AdminLayoutClient';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('deebop-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, displayName: true },
    });

    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
