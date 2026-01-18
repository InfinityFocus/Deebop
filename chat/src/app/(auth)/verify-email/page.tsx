'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared';
import { useAuthStore } from '@/stores/authStore';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthStore();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          // Update the auth store with the user
          if (data.data.user) {
            setUser(data.data.user);
          }
          // Redirect to onboarding after 2 seconds
          setTimeout(() => {
            router.push('/onboarding/welcome');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router, setUser]);

  if (status === 'loading') {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
            <Loader2 className="text-cyan-400 animate-spin" size={40} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Verifying Your Email</h1>
          <p className="text-gray-400">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-400" size={40} />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-gray-400">
            Your email has been verified successfully. Redirecting you to get started...
          </p>
        </div>
        <div className="pt-4">
          <Link href="/onboarding/welcome">
            <Button className="w-full">Continue to Setup</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <XCircle className="text-red-400" size={40} />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
        <p className="text-gray-400">{errorMessage}</p>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        <p className="text-gray-300 text-sm">
          The verification link may have expired or already been used.
          You can request a new verification email by logging in.
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/parent/login">
          <Button className="w-full">Go to Login</Button>
        </Link>
        <Link href="/parent/register">
          <Button variant="outline" className="w-full">Create New Account</Button>
        </Link>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
