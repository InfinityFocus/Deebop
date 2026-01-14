'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function VerificationPendingPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.alreadyVerified) {
        window.location.href = '/login';
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to send verification email');
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            {sent ? (
              <CheckCircle size={32} className="text-emerald-400" />
            ) : (
              <Mail size={32} className="text-emerald-400" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {sent ? 'Check Your Email' : 'Verify Your Email'}
          </h2>

          <p className="text-gray-400 mb-6">
            {sent
              ? "We've sent a new verification link to your email. Please check your inbox and spam folder."
              : "We've sent a verification link to your email. Please check your inbox and click the link to verify your account."}
          </p>

          {!sent && (
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </form>
          )}

          {sent && (
            <button
              onClick={() => setSent(false)}
              className="w-full px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition"
            >
              Send Again
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Already verified?{' '}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <Link href="/contact" className="text-emerald-400 hover:underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
