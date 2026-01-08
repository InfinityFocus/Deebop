'use client';

import { Layout, Link2, Mail, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

const benefits = [
  {
    icon: Layout,
    title: 'Featured work + links',
    description: 'Showcase your best content and link to your other platforms.',
  },
  {
    icon: Link2,
    title: 'Affiliate links with disclosure',
    description: 'Share product recommendations with automatic disclosure labels.',
  },
  {
    icon: Mail,
    title: 'Email capture',
    description: 'Build your mailing list directly from your Creator Page.',
  },
  {
    icon: BarChart3,
    title: 'Click analytics',
    description: 'Track link clicks and page views. Available on Standard and Pro tiers.',
  },
];

export default function CreatorPageSection() {
  const { trackCta } = useHomepageAnalytics();

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Description */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Creator Page
            </h2>
            <p className="text-gray-400 mb-6">
              Your bio link landing page. Not just a profile &mdash; a conversion page designed to turn visitors into followers, subscribers, and customers.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                      <p className="text-gray-500 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                onClick={() => trackCta('build_creator_page')}
                className="inline-flex items-center gap-2 rounded-full bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
              >
                Build your Creator Page
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Right: Visual mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl">
              {/* Mock Creator Page */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mb-3" />
                <h3 className="text-lg font-bold text-white">@creator</h3>
                <p className="text-gray-400 text-sm">Photographer & Visual Artist</p>
              </div>

              {/* Mock links */}
              <div className="space-y-3">
                <div className="w-full py-3 px-4 rounded-lg bg-gray-800 text-center text-white text-sm font-medium">
                  Portfolio
                </div>
                <div className="w-full py-3 px-4 rounded-lg bg-gray-800 text-center text-white text-sm font-medium flex items-center justify-center gap-2">
                  Shop my presets
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Affiliate</span>
                </div>
                <div className="w-full py-3 px-4 rounded-lg bg-emerald-500 text-center text-black text-sm font-medium">
                  Subscribe to newsletter
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-2xl border border-yellow-500/20 bg-yellow-500/5" />
          </div>
        </div>
      </div>
    </section>
  );
}
