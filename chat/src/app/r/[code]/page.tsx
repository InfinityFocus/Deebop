'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Heart, Users, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface ReferralData {
  referralId: string;
  code: string;
  childNames: string[] | null;
  referrer: {
    displayName: string;
    childrenNames: string[];
  } | null;
  redirectUrl: string;
}

export default function ReferralLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = params.code as string;
  const namesParam = searchParams.get('names');

  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function trackReferral() {
      try {
        // Build URL with names if present
        let url = `/api/referral/${code}`;
        if (namesParam) {
          url += `?names=${encodeURIComponent(namesParam)}`;
        }

        const res = await fetch(url);
        const result = await res.json();

        if (result.success) {
          setData(result.data);
          // Store referral info in localStorage for registration
          localStorage.setItem('deebop_referral', JSON.stringify({
            code: result.data.code,
            referralId: result.data.referralId,
            childNames: result.data.childNames,
          }));
        } else {
          setError(result.error || 'Invalid invite link');
        }
      } catch (err) {
        console.error('Failed to track referral:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    trackReferral();
  }, [code, namesParam]);

  const handleGetStarted = () => {
    router.push('/parent/register');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => router.push('/parent/register')}>
              Sign Up Anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Build personalized message
  const referrerName = data?.referrer?.displayName || 'A friend';
  const referrerChildren = data?.referrer?.childrenNames || [];
  const inviteeChildren = data?.childNames || [];

  let headline = "You've been invited to Deebop Chat";
  let subline = "A safe messaging app for kids";

  if (inviteeChildren.length > 0 && referrerChildren.length > 0) {
    const inviteeNames = inviteeChildren.join(' and ');
    const referrerChildNames = referrerChildren.slice(0, 2).join(' and ');
    headline = `${referrerName} wants ${inviteeNames} to connect with ${referrerChildNames}`;
    subline = "on Deebop Chat";
  } else if (referrerChildren.length > 0) {
    const referrerChildNames = referrerChildren.slice(0, 2).join(' and ');
    headline = `${referrerName} wants your child to connect with ${referrerChildNames}`;
    subline = "on Deebop Chat";
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Card */}
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-cyan-400 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {headline}
          </h1>
          <p className="text-gray-400 mb-8">{subline}</p>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="w-full"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={Shield}
            title="Parent-controlled"
            description="Approve friends and messages"
          />
          <FeatureCard
            icon={Users}
            title="Made for families"
            description="Safe chat for kids 6-12"
          />
        </div>

        {/* Transparency note */}
        <div className="bg-dark-800/50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            When you subscribe and complete your first paid month,
            <br />
            <span className="text-gray-400">{referrerName} will receive 1 month free</span>
            <br />
            as a thank you for inviting you.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <h3 className="font-medium text-white text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}
