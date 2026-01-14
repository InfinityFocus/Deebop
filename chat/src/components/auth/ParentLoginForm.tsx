'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useAuthStore } from '@/stores/authStore';

export function ParentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setChildren } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nextUrl = searchParams.get('next') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/parent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Update store
      setUser(data.data.user);

      // Fetch children
      const meResponse = await fetch('/api/auth/me');
      const meData = await meResponse.json();
      if (meData.success && meData.data.children) {
        setChildren(meData.data.children);
      }

      // Redirect
      router.push(nextUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Parent Login</h1>
        <p className="text-gray-400">
          Sign in to manage your family&apos;s accounts
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={20} />}
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={20} />}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      {/* Links */}
      <div className="space-y-4 pt-4 border-t border-dark-700">
        <p className="text-center text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/parent/register"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Create one
          </Link>
        </p>

        <p className="text-center">
          <Link
            href="/login"
            className="text-gray-500 hover:text-gray-400 text-sm"
          >
            ← Back to login options
          </Link>
        </p>
      </div>
    </div>
  );
}
