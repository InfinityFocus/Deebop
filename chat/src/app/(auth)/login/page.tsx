import Link from 'next/link';
import { User, Baby } from 'lucide-react';

export const metadata = {
  title: 'Login',
};

export default function LoginSelectorPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">Who&apos;s logging in today?</p>
      </div>

      {/* Login Options */}
      <div className="space-y-4">
        <Link
          href="/parent/login"
          className="flex items-center gap-4 p-6 bg-dark-800 border border-dark-700 rounded-2xl hover:border-primary-500 hover:bg-dark-750 transition-all group"
        >
          <div className="w-14 h-14 bg-dark-700 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition">
            <User size={28} className="text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">I&apos;m a Parent</h2>
            <p className="text-sm text-gray-400">
              Manage your children&apos;s accounts and messages
            </p>
          </div>
        </Link>

        <Link
          href="/child/login"
          className="flex items-center gap-4 p-6 bg-dark-800 border border-dark-700 rounded-2xl hover:border-cyan-500 hover:bg-dark-750 transition-all group"
        >
          <div className="w-14 h-14 bg-dark-700 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition">
            <Baby size={28} className="text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">I&apos;m a Kid</h2>
            <p className="text-sm text-gray-400">
              Chat with your friends
            </p>
          </div>
        </Link>
      </div>

      {/* Register Link */}
      <div className="text-center pt-4 border-t border-dark-700">
        <p className="text-gray-400">
          New to Deebop Chat?{' '}
          <Link
            href="/parent/register"
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Create a parent account
          </Link>
        </p>
      </div>
    </div>
  );
}
