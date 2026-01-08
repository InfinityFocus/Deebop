import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { GroupManager } from '@/components/settings/GroupManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Audience Groups - Deebop',
  description: 'Manage your audience groups for private sharing',
};

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Profile
      </Link>

      <GroupManager />
    </div>
  );
}
