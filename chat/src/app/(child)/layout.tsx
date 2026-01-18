'use client';

import { ChildNavbar } from '@/components/child/ChildNavbar';
import { useHeartbeat } from '@/hooks/useHeartbeat';

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Send heartbeats to update presence status
  useHeartbeat();

  return (
    <div className="min-h-screen bg-dark-900">
      <ChildNavbar />
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
