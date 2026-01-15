'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useAuthStore } from '@/stores/authStore';

export function ParentRegisterForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/parent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Update store
      setUser(data.data.user);

      // Redirect to onboarding
      router.push('/onboarding/welcome');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">
          Set up your parent account to get started
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
          label="Your Name (optional)"
          type="text"
          placeholder="How should we call you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<User size={20} />}
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={20} />}
          required
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={20} />}
            required
            autoComplete="new-password"
          />
          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <PasswordRequirement met={hasMinLength}>
                At least 8 characters
              </PasswordRequirement>
              <PasswordRequirement met={hasLetter}>
                Contains a letter
              </PasswordRequirement>
              <PasswordRequirement met={hasNumber}>
                Contains a number
              </PasswordRequirement>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Type your password again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock size={20} />}
          required
          autoComplete="new-password"
          error={
            confirmPassword.length > 0 && !passwordsMatch
              ? 'Passwords do not match'
              : undefined
          }
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          disabled={!isPasswordValid || !passwordsMatch}
        >
          Create Account
        </Button>
      </form>

      {/* Links */}
      <div className="space-y-4 pt-4 border-t border-dark-700">
        <p className="text-center text-gray-400">
          Already have an account?{' '}
          <Link
            href="/parent/login"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Sign in
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

function PasswordRequirement({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle size={16} className="text-primary-400" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-dark-500" />
      )}
      <span className={met ? 'text-gray-300' : 'text-gray-500'}>{children}</span>
    </div>
  );
}
