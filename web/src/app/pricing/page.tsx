import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Deebop. Free tier available, upgrade anytime.',
};

interface Feature {
  text: string;
  included: boolean;
  negative?: boolean;
}

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  tagline: string | null;
  features: Feature[];
  cta: string;
  href: string;
  highlighted: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '£0',
    period: '/month',
    description: 'Get started with the basics',
    tagline: null,
    features: [
      { text: '1 Profile', included: true },
      { text: 'Unlimited images', included: true },
      { text: 'Videos up to 30s', included: true },
      { text: 'Audio up to 1 min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums (2GB)', included: true },
      { text: '3 Scheduled Drops max', included: true },
      { text: 'Audience Groups', included: true },
      { text: 'Events', included: true },
      { text: 'Provenance Labels', included: true },
      { text: '360 Panoramas', included: false },
      { text: 'Profile link', included: false },
      { text: 'Creator Page', included: false },
      { text: 'Ads in feed', included: true, negative: true },
    ],
    cta: 'Get Started',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Creator',
    price: '£3.99',
    period: '/month',
    description: 'For content creators',
    tagline: 'Two profiles, post to one at a time. Repost across profiles when it makes sense.',
    features: [
      { text: '2 Profiles', included: true },
      { text: 'Unlimited images', included: true },
      { text: 'Videos up to 3 min', included: true },
      { text: 'Audio up to 5 min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums (10GB)', included: true },
      { text: 'Unlimited Scheduled Drops', included: true },
      { text: '360 Panoramas (100MB)', included: true },
      { text: 'Profile link', included: true },
      { text: 'Creator Page (basic)', included: true },
      { text: 'Repost to own profiles', included: true },
      { text: 'Reduced ads', included: true },
    ],
    cta: 'Upgrade to Creator',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '£9.99',
    period: '/month',
    description: 'For professionals',
    tagline: 'Publish once, share across your profiles when it makes sense.',
    features: [
      { text: '5 Profiles', included: true },
      { text: 'Unlimited images', included: true },
      { text: 'Videos up to 10 min', included: true },
      { text: 'Audio up to 30 min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums (50GB)', included: true },
      { text: 'Unlimited Scheduled Drops', included: true },
      { text: '360 Panoramas (100MB)', included: true },
      { text: 'Profile link', included: true },
      { text: 'Creator Page (full)', included: true },
      { text: 'Multi-profile publishing', included: true },
      { text: 'No ads', included: true },
    ],
    cta: 'Go Pro',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Teams',
    price: '£24.99',
    period: '/month',
    description: 'For organizations',
    tagline: 'One workspace, many profiles, with role-based publishing controls.',
    features: [
      { text: '30 Profiles', included: true },
      { text: 'Unlimited images', included: true },
      { text: 'Videos up to 10 min', included: true },
      { text: 'Audio up to 1 hour', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums (100GB)', included: true },
      { text: 'Unlimited Scheduled Drops', included: true },
      { text: '360 Panoramas (100MB)', included: true },
      { text: 'Creator Page (full)', included: true },
      { text: 'Multi-profile publishing', included: true },
      { text: 'Role-gated publishing', included: true },
      { text: 'Workspace with drafts', included: true },
      { text: 'No ads', included: true },
    ],
    cta: 'Get Teams',
    href: '/register',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready for more.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={clsx(
                'rounded-2xl border p-6 relative flex flex-col',
                tier.highlighted
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-gray-800 bg-gray-900/50'
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <h2 className="text-xl font-bold mb-2">{tier.name}</h2>
              <p className="text-gray-400 text-sm mb-2">{tier.description}</p>
              {tier.tagline && (
                <p className="text-gray-500 text-xs italic mb-4">{tier.tagline}</p>
              )}

              <div className="mb-6">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>

              <ul className="space-y-2 mb-8 flex-grow">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check
                        size={16}
                        className={clsx(
                          'flex-shrink-0 mt-0.5',
                          feature.negative ? 'text-orange-400' : 'text-green-400'
                        )}
                      />
                    ) : (
                      <X size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={clsx(
                        'text-sm',
                        feature.included ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={clsx(
                  'block w-full text-center py-3 rounded-full font-semibold transition',
                  tier.highlighted
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <h3 className="font-semibold mb-2">What features are available on all plans?</h3>
              <p className="text-gray-400">
                Collaborative Albums, Scheduled Drops, Audience Groups, Provenance Labels, and
                Hashtag Discovery are available on all plans, including Free. Upgrade for larger
                media limits, Post Boosts, and an ad-free experience.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
              <p className="text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes take
                effect at the start of your next billing cycle.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-400">
                Our Free tier is always available. You can use it indefinitely and upgrade
                whenever you&apos;re ready for more features.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
