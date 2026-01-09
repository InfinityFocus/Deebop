'use client';

/**
 * Cookie Preferences Page
 * Standalone page for managing cookie preferences
 */

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CookiePreferencesContent from '@/components/cookies/CookiePreferencesContent';

export default function CookiePreferencesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold mb-8">Cookie Preferences</h1>
        <p className="text-gray-400 mb-8">
          Control how we use cookies on this website.
        </p>

        <CookiePreferencesContent />
      </main>

      <Footer />
    </div>
  );
}
