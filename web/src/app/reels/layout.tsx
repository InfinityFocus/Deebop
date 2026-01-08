import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ReelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* Back button */}
      <Link
        href="/home"
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
      >
        <ArrowLeft size={24} />
      </Link>

      {children}
    </div>
  );
}
