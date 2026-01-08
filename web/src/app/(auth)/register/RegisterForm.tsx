'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate year options (current year - 13 down to current year - 120)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 108 }, (_, i) => currentYear - 13 - i);

  // Username validation
  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
  const usernameError = username.length > 0 && !usernameValid
    ? 'Username must be 3-30 characters (letters, numbers, underscores only)'
    : null;

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!usernameValid) {
      setError('Please enter a valid username');
      return;
    }
    if (!passwordValid) {
      setError('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    if (!birthYear) {
      setError('Please select your year of birth');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, birthYear }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Fetch full user profile
      const profileRes = await fetch('/api/auth/me');
      const profileData = await profileRes.json();

      if (profileData.user) {
        setUser(profileData.user);
      }

      // Redirect to home (no email verification in local dev)
      router.push('/home');
      router.refresh();
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            required
            autoComplete="username"
            maxLength={30}
            className={`w-full pl-8 pr-4 py-3 bg-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 ${
              usernameError ? 'border-red-500' : 'border-gray-700'
            }`}
            placeholder="username"
          />
        </div>
        {usernameError && (
          <p className="text-red-400 text-xs mt-1">{usernameError}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 pr-12"
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Password requirements */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
            <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
            <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
            <PasswordCheck passed={passwordChecks.number} label="One number" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          className={`w-full px-4 py-3 bg-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 ${
            confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500' : 'border-gray-700'
          }`}
          placeholder="Confirm your password"
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
        )}
      </div>

      <div>
        <label htmlFor="birthYear" className="block text-sm font-medium text-gray-300 mb-1">
          Year of birth
        </label>
        <select
          id="birthYear"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          required
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
        >
          <option value="">Select year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <p className="text-gray-500 text-xs mt-1">You must be at least 13 years old to register</p>
      </div>

      <div className="text-sm text-gray-400">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
          Privacy Policy
        </Link>
        .
      </div>

      <button
        type="submit"
        disabled={isLoading || !usernameValid || !passwordValid || !passwordsMatch || !birthYear}
        className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-green-400' : 'text-gray-500'}`}>
      {passed ? <Check size={12} /> : <X size={12} />}
      {label}
    </div>
  );
}
