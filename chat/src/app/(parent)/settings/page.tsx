'use client';

import { useState } from 'react';
import { Save, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/parent/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });

      const data = await response.json();

      if (data.success) {
        setUser({ ...user!, displayName });
        setSuccess('Profile updated successfully');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/parent/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <CheckCircle className="text-primary-400 flex-shrink-0" size={20} />
          <p className="text-primary-400 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={user?.type === 'parent' ? user.email : ''}
              disabled
              className="opacity-50"
            />
            <Input
              label="Display Name"
              type="text"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button type="submit" isLoading={isSaving}>
              <Save size={16} className="mr-2" />
              Save Profile
            </Button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              required
            />

            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock size={20} />}
                required
              />
              {newPassword.length > 0 && (
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
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
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

            <Button
              type="submit"
              isLoading={isChangingPassword}
              disabled={!currentPassword || !isPasswordValid || !passwordsMatch}
            >
              <Lock size={16} className="mr-2" />
              Change Password
            </Button>
          </form>
        </div>
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
