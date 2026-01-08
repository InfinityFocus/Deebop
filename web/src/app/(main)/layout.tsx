import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MiniPlayer } from '@/components/audio';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh flex flex-col md:flex-row overflow-hidden">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-20 md:pb-0 md:ml-64" tabIndex={-1}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <Navbar />

      {/* Global Audio Mini Player */}
      <MiniPlayer />
    </div>
  );
}
