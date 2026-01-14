import { Suspense } from 'react';
import { Metadata } from 'next';
import { VerifyEmailContent } from './VerifyEmailContent';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your Deebop email address',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold logo-shimmer">Deebop</h1>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" />
          <div className="h-8 bg-gray-800 rounded w-3/4 mx-auto mb-4 animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-2/3 mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
}
