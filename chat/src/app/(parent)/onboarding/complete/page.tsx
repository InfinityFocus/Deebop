'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, MessageCircle, CheckCircle, Settings, PartyPopper } from 'lucide-react';
import { OnboardingProgress } from '@/components/parent/onboarding/OnboardingProgress';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGotoDashboard = async () => {
    setIsLoading(true);

    try {
      // Mark onboarding as complete
      await fetch('/api/parent/complete-onboarding', {
        method: 'POST',
      });
    } catch {
      // Continue even if this fails
    }

    router.push('/dashboard');
  };

  return (
    <div>
      <OnboardingProgress currentStep={6} />

      <div className="card p-6 text-center">
        {/* Celebration icon */}
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <Image
            src="/icon.png"
            alt="Deebop Chat"
            width={80}
            height={80}
            className="rounded-2xl"
          />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <PartyPopper size={16} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re in control
        </h1>
        <p className="text-gray-400 mb-8">
          Your family is all set up. Here&apos;s what you can do from your dashboard.
        </p>

        {/* Dashboard highlights */}
        <div className="space-y-4 mb-8 text-left">
          <HighlightItem
            icon={<MessageCircle className="text-primary-400" size={20} />}
            text="View conversations"
            description="See what your child is talking about"
          />
          <HighlightItem
            icon={<CheckCircle className="text-emerald-400" size={20} />}
            text="Approve messages and friends"
            description="Friend requests and messages that need your approval"
          />
          <HighlightItem
            icon={<Settings className="text-gray-400" size={20} />}
            text="Change rules anytime"
            description="Adjust oversight level, quiet hours, and more"
          />
        </div>

        <button
          onClick={handleGotoDashboard}
          disabled={isLoading}
          className="btn btn-primary w-full py-3 text-lg"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Go to dashboard'
          )}
        </button>
      </div>
    </div>
  );
}

function HighlightItem({
  icon,
  text,
  description,
}: {
  icon: React.ReactNode;
  text: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-xl">
      <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-white font-medium">{text}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}
