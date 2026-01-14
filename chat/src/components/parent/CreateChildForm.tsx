'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { AvatarSelector } from '@/components/child/AvatarSelector';
import { OversightSelector } from '@/components/parent/OversightSelector';
import type { AgeBand, OversightMode } from '@/types';

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: '6-8', label: '6-8 years old' },
  { value: '9-10', label: '9-10 years old' },
  { value: '11-12', label: '11-12 years old' },
];

export function CreateChildForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarId, setAvatarId] = useState('cat');
  const [ageBand, setAgeBand] = useState<AgeBand>('6-8');
  const [oversightMode, setOversightMode] = useState<OversightMode>('approve_first');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Password validation
  const hasMinLength = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = hasMinLength;

  // Username validation
  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(username);

  const checkUsername = async (value: string) => {
    if (!isUsernameValid) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch(`/api/parent/children/check-username?username=${value}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    setUsernameAvailable(null);

    // Debounce the check
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => checkUsername(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isUsernameValid) {
      setError('Username must be 3-20 characters (letters, numbers, underscore)');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName: displayName.trim(),
          password,
          avatarId,
          ageBand,
          oversightMode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create account. Please try again.');
        return;
      }

      // Success - redirect to children list
      router.push('/children');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s < step
                  ? 'bg-primary-500 text-white'
                  : s === step
                  ? 'bg-primary-500/20 text-primary-400 border-2 border-primary-500'
                  : 'bg-dark-700 text-gray-500'
              }`}
            >
              {s < step ? <CheckCircle size={16} /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'text-white' : 'text-gray-500'}`}>
              {s === 1 ? 'Account' : s === 2 ? 'Profile' : 'Settings'}
            </span>
            {s < 3 && (
              <div className={`w-8 h-0.5 ${s < step ? 'bg-primary-500' : 'bg-dark-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Account Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account Details</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={handleUsernameChange}
                    leftIcon={<span className="text-gray-500">@</span>}
                    required
                    error={
                      username.length > 0 && !isUsernameValid
                        ? '3-20 characters (a-z, 0-9, _)'
                        : usernameAvailable === false
                        ? 'Username already taken'
                        : undefined
                    }
                  />
                  {isCheckingUsername && (
                    <p className="text-gray-500 text-sm mt-1">Checking availability...</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-primary-400 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle size={14} /> Username available
                    </p>
                  )}
                </div>

                <Input
                  label="Display Name"
                  type="text"
                  placeholder="Your child's name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leftIcon={<User size={20} />}
                  required
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password (6+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={20} />}
                    required
                  />
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        {hasMinLength ? (
                          <CheckCircle size={14} className="text-primary-400" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-dark-500" />
                        )}
                        <span className={hasMinLength ? 'text-gray-300' : 'text-gray-500'}>
                          At least 6 characters
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Type password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={20} />}
                  required
                  error={
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'Passwords do not match'
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!isUsernameValid || !displayName.trim() || !isPasswordValid || !passwordsMatch}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Choose an Avatar</h2>
              <AvatarSelector selected={avatarId} onSelect={setAvatarId} />
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Age Range</h2>
              <div className="grid grid-cols-3 gap-3">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band.value}
                    type="button"
                    onClick={() => setAgeBand(band.value)}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      ageBand === band.value
                        ? 'border-primary-500 bg-primary-500/10 text-white'
                        : 'border-dark-600 text-gray-400 hover:border-dark-500'
                    }`}
                  >
                    <span className="text-lg font-bold">{band.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Safety Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Message Oversight</h2>
              <p className="text-gray-400 text-sm mb-4">
                Choose how much control you want over your child&apos;s messages
              </p>
              <OversightSelector selected={oversightMode} onSelect={setOversightMode} />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Create Account
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
