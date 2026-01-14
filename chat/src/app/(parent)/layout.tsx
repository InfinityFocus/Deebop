import { ParentSidebar } from '@/components/parent/ParentSidebar';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <ParentSidebar />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
