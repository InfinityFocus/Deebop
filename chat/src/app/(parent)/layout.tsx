import { ParentSidebar } from '@/components/parent/ParentSidebar';
import { ParentBottomNav } from '@/components/parent/ParentBottomNav';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Desktop Sidebar */}
      <ParentSidebar />

      {/* Main Content - pb-20 for mobile bottom nav, md:pb-0 for desktop */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <ParentBottomNav />
    </div>
  );
}
