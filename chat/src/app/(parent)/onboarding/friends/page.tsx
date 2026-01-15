'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, User, Send, CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { OnboardingProgress } from '@/components/parent/onboarding/OnboardingProgress';

function FriendsContent() {
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId');

  return (
    <div>
      <OnboardingProgress currentStep={4} />

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Friends are always approved
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          Your child can only message people you approve.<br />
          No strangers. No public discovery.
        </p>

        {/* Visual diagram */}
        <div className="bg-dark-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            {/* Step 1: Child */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center mb-2">
                <User size={24} className="text-cyan-400" />
              </div>
              <span className="text-xs text-gray-400 text-center">Child</span>
            </div>

            <ArrowRight size={20} className="text-gray-600 hidden md:block" />
            <span className="text-gray-600 md:hidden">→</span>

            {/* Step 2: Friend Request */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mb-2">
                <Send size={24} className="text-yellow-400" />
              </div>
              <span className="text-xs text-gray-400 text-center">Friend<br />request</span>
            </div>

            <ArrowRight size={20} className="text-gray-600 hidden md:block" />
            <span className="text-gray-600 md:hidden">→</span>

            {/* Step 3: Parent Approves */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <span className="text-xs text-gray-400 text-center">Parent<br />approves</span>
            </div>

            <ArrowRight size={20} className="text-gray-600 hidden md:block" />
            <span className="text-gray-600 md:hidden">→</span>

            {/* Step 4: Messaging Opens */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center mb-2">
                <MessageCircle size={24} className="text-primary-400" />
              </div>
              <span className="text-xs text-gray-400 text-center">Messaging<br />opens</span>
            </div>
          </div>
        </div>

        {/* Reassurance bullets */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={12} className="text-emerald-400" />
            </div>
            <span className="text-gray-300 text-sm">
              Friend requests come to you first
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={12} className="text-emerald-400" />
            </div>
            <span className="text-gray-300 text-sm">
              You see who your child&apos;s friends are
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={12} className="text-emerald-400" />
            </div>
            <span className="text-gray-300 text-sm">
              You can remove friends at any time
            </span>
          </div>
        </div>

        <Link
          href={`/onboarding/quiet-hours${childId ? `?childId=${childId}` : ''}`}
          className="btn btn-primary w-full py-3"
        >
          Got it
        </Link>
      </div>
    </div>
  );
}

export default function OnboardingFriendsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <FriendsContent />
    </Suspense>
  );
}
