'use client';

import { useAuth } from '@/hooks/useAuth';
import { EmbedCodeGenerator } from '@/components/embed';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function EmbedSettingsPage() {
  const { user, isLoading } = useAuth();

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://deebop.com';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-96 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Lock size={48} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-4">
            You need to be logged in to generate embed codes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={18} />
        Back to Settings
      </Link>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Embed Your Feed</h1>
        <p className="text-gray-400 mt-1">
          Share your Deebop content on external websites using embeddable widgets.
        </p>
      </div>

      {/* Info banner for non-Pro users */}
      {user.tier !== 'pro' && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-emerald-400 font-medium">
                Upgrade to Pro for Clean Embeds
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Pro users can hide the &quot;Powered by Deebop&quot; branding from their embeds.
              </p>
            </div>
            <Link
              href="/settings/subscription"
              className="flex-shrink-0 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Embed Code Generator */}
      <EmbedCodeGenerator
        username={user.username}
        mode="feed"
        baseUrl={baseUrl}
      />
    </div>
  );
}
