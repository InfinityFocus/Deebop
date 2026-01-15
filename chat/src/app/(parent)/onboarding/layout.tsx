import Image from 'next/image';
import Link from 'next/link';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="py-4 px-4 border-b border-dark-700">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Deebop Chat"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold logo-shimmer">Deebop Chat</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Deebop Chat</p>
      </footer>
    </div>
  );
}
