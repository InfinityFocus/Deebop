'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Check, X } from 'lucide-react';
import { OnboardingProgress } from '@/components/parent/onboarding/OnboardingProgress';
import type { AgeBand } from '@/types';

const AGE_OPTIONS: { value: AgeBand; label: string; sublabel: string }[] = [
  { value: '6-8', label: '6–8', sublabel: 'Guided' },
  { value: '9-10', label: '9–10', sublabel: 'Balanced' },
  { value: '11-12', label: '11–12', sublabel: 'More independent' },
];

export default function OnboardingAddChildPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('9-10');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Username availability check with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await fetch(`/api/parent/children/check-username?username=${username}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(username);
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = displayName && isUsernameValid && usernameStatus === 'available' && isPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          password,
          avatarId: 'cat', // Default avatar
          ageBand,
          oversightMode: 'approve_first', // Default, will be updated in next step
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Navigate to oversight selection with child ID
      router.push(`/onboarding/oversight?childId=${data.data.id}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <OnboardingProgress currentStep={2} />

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Add your child</h1>
        <p className="text-gray-400 mb-6">
          Create an account for your child to start messaging.
        </p>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Child&apos;s name or nickname
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="e.g., Emma"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="input pr-10"
                placeholder="e.g., emma_2018"
                required
              />
              {usernameStatus !== 'idle' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check size={18} className="text-emerald-400" />
                  )}
                  {usernameStatus === 'taken' && (
                    <X size={18} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, lowercase letters, numbers, and underscores only
            </p>
            {usernameStatus === 'taken' && (
              <p className="text-xs text-red-400 mt-1">This username is already taken</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
              required
            />
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isPasswordValid ? 'bg-emerald-500' : 'bg-dark-600'}`}>
                {isPasswordValid && <Check size={10} className="text-white" />}
              </div>
              <span className={`text-xs ${isPasswordValid ? 'text-emerald-400' : 'text-gray-500'}`}>
                At least 6 characters
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Re-enter password"
              required
            />
            {confirmPassword && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {passwordsMatch ? <Check size={10} className="text-white" /> : <X size={10} className="text-white" />}
                </div>
                <span className={`text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          {/* Age Band */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              How old is your child?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAgeBand(option.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-colors ${
                    ageBand === option.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <span className={`block font-semibold ${ageBand === option.value ? 'text-white' : 'text-gray-300'}`}>
                    {option.label}
                  </span>
                  <span className={`text-xs ${ageBand === option.value ? 'text-primary-400' : 'text-gray-500'}`}>
                    {option.sublabel}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This helps us choose sensible defaults. You can change everything later.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full py-3 mt-6"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Add child'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
