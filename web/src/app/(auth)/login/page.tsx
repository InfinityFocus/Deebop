import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Deebop account',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-400 mt-2">Sign in to your account</p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-800 rounded-lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
