import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Deebop. Free tier available, upgrade anytime.',
};

const tiers = [
  {
    name: 'Free',
    price: '£0',
    period: '/month',
    description: 'Get started with the basics',
    features: [
      { text: 'Images up to 500KB compressed', included: true },
      { text: 'Videos up to 30s @ 720p', included: true },
      { text: 'Audio up to 1min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums', included: true },
      { text: 'Scheduled Drops', included: true },
      { text: 'Audience Groups', included: true },
      { text: 'Events', included: true },
      { text: 'Provenance Labels', included: true },
      { text: 'Post Boosts', included: true },
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
    name: 'Standard',
    price: '£5.99',
    period: '/month',
    description: 'For serious creators',
    features: [
      { text: 'Images up to 10MB original quality', included: true },
      { text: 'Videos up to 1min @ 1080p', included: true },
      { text: 'Audio up to 5min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums', included: true },
      { text: 'Scheduled Drops', included: true },
      { text: 'Audience Groups', included: true },
      { text: 'Events', included: true },
      { text: 'Provenance Labels', included: true },
      { text: 'Post Boosts', included: true },
      { text: '360 Panoramas', included: false },
      { text: 'Profile link', included: true },
      { text: 'Creator Page (basic)', included: true },
      { text: 'Priority support', included: false },
      { text: 'Reduced ads', included: true },
    ],
    cta: 'Upgrade to Standard',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '£14.99',
    period: '/month',
    description: 'Everything, unlocked',
    features: [
      { text: 'Images up to 50MB original quality', included: true },
      { text: 'Videos up to 5min @ 4K', included: true },
      { text: 'Audio up to 30min', included: true },
      { text: 'Unlimited shouts', included: true },
      { text: 'Collaborative Albums', included: true },
      { text: 'Scheduled Drops', included: true },
      { text: 'Audience Groups', included: true },
      { text: 'Events', included: true },
      { text: 'Provenance Labels', included: true },
      { text: 'Priority Post Boosts', included: true },
      { text: '360 Panoramas (100MB)', included: true },
      { text: 'Profile link', included: true },
      { text: 'Creator Page (full)', included: true },
      { text: 'Priority support', included: true },
      { text: 'No ads', included: true },
    ],
    cta: 'Go Pro',
    href: '/register',
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to home
          </Link>
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
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={clsx(
                'rounded-2xl border p-8 relative',
                tier.highlighted
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-gray-800 bg-gray-900/50'
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <h2 className="text-xl font-bold mb-2">{tier.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check
                        size={18}
                        className={feature.negative ? 'text-orange-400' : 'text-green-400'}
                      />
                    ) : (
                      <X size={18} className="text-gray-500" />
                    )}
                    <span
                      className={clsx(
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
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
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
