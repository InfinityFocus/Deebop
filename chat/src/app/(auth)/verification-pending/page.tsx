'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared';

function VerificationPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setCooldown(60); // 60 second cooldown
      } else {
        setResendError(data.error || 'Failed to resend email');
      }
    } catch (err) {
      setResendError('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
          <Mail className="text-cyan-400" size={40} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
        <p className="text-gray-400">
          We&apos;ve sent a verification link to
        </p>
        {email && (
          <p className="text-white font-medium mt-1">{email}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        <p className="text-gray-300 text-sm">
          Click the link in the email to verify your account and complete registration.
          The link will expire in 24 hours.
        </p>
        <p className="text-gray-400 text-sm">
          Can&apos;t find the email? Check your spam folder or request a new one below.
        </p>
      </div>

      {/* Success Message */}
      {resendSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
          <p className="text-green-400 text-sm">Verification email sent! Check your inbox.</p>
        </div>
      )}

      {/* Error Message */}
      {resendError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-400 text-sm">{resendError}</p>
        </div>
      )}

      {/* Resend Button */}
      <Button
        onClick={handleResendEmail}
        variant="outline"
        className="w-full"
        disabled={isResending || cooldown > 0 || !email}
        isLoading={isResending}
      >
        <RefreshCw size={18} className="mr-2" />
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
      </Button>

      {/* Links */}
      <div className="space-y-4 pt-4 border-t border-dark-700">
        <p className="text-center text-gray-400">
          Wrong email?{' '}
          <Link
            href="/parent/register"
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Register again
          </Link>
        </p>

        <p className="text-center">
          <Link
            href="/parent/login"
            className="text-gray-500 hover:text-gray-400 text-sm"
          >
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
          <Loader2 className="text-cyan-400 animate-spin" size={40} />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerificationPendingContent />
    </Suspense>
  );
}
