import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Users, Sliders, Check } from 'lucide-react';

export default function OnboardingWelcomePage() {
  return (
    <div className="text-center">
      {/* Logo */}
      <div className="w-20 h-20 mx-auto mb-6">
        <Image
          src="/icon.png"
          alt="Deebop Chat"
          width={80}
          height={80}
          className="rounded-2xl shadow-lg shadow-primary-500/20"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-4">
        Welcome to Deebop Chat
      </h1>

      {/* Description */}
      <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
        Deebop Chat is a simple, safe way for your child to message real friends, with you always in control.
      </p>

      {/* Trust bullets */}
      <div className="space-y-4 mb-10 max-w-sm mx-auto">
        <TrustBullet
          icon={<ShieldCheck className="text-primary-400" size={20} />}
          text="No public profiles or strangers"
        />
        <TrustBullet
          icon={<Users className="text-primary-400" size={20} />}
          text="You approve friends"
        />
        <TrustBullet
          icon={<Sliders className="text-primary-400" size={20} />}
          text="You choose how much you see and approve"
        />
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/onboarding/add-child"
          className="btn btn-primary w-full text-lg py-4"
        >
          Set up my family
        </Link>
        <Link
          href="/#how-it-works"
          className="btn btn-ghost w-full"
        >
          Learn how it works
        </Link>
      </div>
    </div>
  );
}

function TrustBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-gray-300">{text}</span>
    </div>
  );
}
