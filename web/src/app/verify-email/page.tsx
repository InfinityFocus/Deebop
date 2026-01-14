'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Verification failed');
        return;
      }

      if (data.alreadyVerified) {
        setStatus('already_verified');
      } else {
        setStatus('success');
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/home');
        }, 3000);
      }
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold logo-shimmer">Deebop</h1>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={32} className="text-emerald-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying your email...
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-400 mb-6">
                Your email has been verified successfully. Redirecting you to Deebop...
              </p>
              <Link
                href="/home"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
              >
                Go to Deebop
              </Link>
            </>
          )}

          {status === 'already_verified' && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Already Verified
              </h2>
              <p className="text-gray-400 mb-6">
                Your email address has already been verified. You can log in to your account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Link
                  href="/verification-pending"
                  className="block w-full px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
                >
                  Request New Link
                </Link>
                <Link
                  href="/login"
                  className="block w-full px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
