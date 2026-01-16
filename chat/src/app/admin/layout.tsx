import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import { AdminLayoutClient } from './AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthorized = await isAdmin();

  if (!isAuthorized) {
    redirect('/parent/login?redirect=/admin');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
