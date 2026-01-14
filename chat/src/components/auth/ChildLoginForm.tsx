'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AtSign, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useAuthStore } from '@/stores/authStore';

export function ChildLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nextUrl = searchParams.get('next') || '/friends';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/child/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Update store
      setUser(data.data.user);

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
      {/* Header with fun styling for kids */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl mb-4">
          <Sparkles size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Hey there! 👋</h1>
        <p className="text-gray-400">Enter your username to start chatting</p>
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
          label="Username"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          leftIcon={<AtSign size={20} />}
          required
          autoComplete="username"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          placeholder="Your secret password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={20} />}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          size="lg"
          isLoading={isLoading}
        >
          Let&apos;s Go! 🚀
        </Button>
      </form>

      {/* Help Text */}
      <div className="text-center space-y-3 pt-4 border-t border-dark-700">
        <p className="text-gray-400 text-sm">
          Don&apos;t have a username yet?
          <br />
          Ask your parent to create one for you!
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
