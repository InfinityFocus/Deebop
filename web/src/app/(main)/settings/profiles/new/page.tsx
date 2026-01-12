'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewProfilePage() {
  const router = useRouter();
  const { canAddProfile, profileLimit, profiles, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          displayName: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      await refreshUser();
      router.push('/settings/profiles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can add profiles
  if (!canAddProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <PageHeader title="Add New Profile" />

        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            You have reached the maximum number of profiles ({profileLimit}) for your plan.
          </p>
          <Link
            href="/settings/subscription"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Upgrade to Add More Profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <PageHeader title="Add New Profile" />

      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-400">
          Creating profile {profiles.length + 1} of {profileLimit}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Each profile has its own username, followers, and content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="username"
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]{3,20}"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, lowercase letters, numbers, and underscores only
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="How you want to be shown"
            maxLength={50}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || username.length < 3}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Profile'
            )}
          </button>
          <Link
            href="/settings/profiles"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
