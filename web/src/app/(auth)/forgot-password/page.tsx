import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Deebop password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold logo-shimmer">
              Deebop
            </h1>
          </div>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Reset Your Password
            </h2>

            <p className="text-gray-400 mb-6">
              Password reset functionality is coming soon. In the meantime, please contact us if you need help accessing your account.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
            >
              <Mail size={20} />
              Contact Support
            </Link>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-500">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
