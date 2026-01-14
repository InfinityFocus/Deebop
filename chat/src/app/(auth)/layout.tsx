import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      {/* Header */}
      <header className="py-4 px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Deebop Chat</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        <p>Safe messaging for kids and families</p>
      </footer>
    </div>
  );
}
