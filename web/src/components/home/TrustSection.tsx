'use client';

import { Shield, Tag, Filter, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Shield,
    title: 'Provenance labels',
    description: 'Know if content is Original, AI Assisted, AI Generated, or Composite. Full transparency.',
  },
  {
    icon: Tag,
    title: 'Paid partnership disclosure',
    description: 'Creators must label sponsored content. You always know what\'s promotional.',
  },
  {
    icon: Filter,
    title: 'Explore filters',
    description: 'Filter by Original only, hide paid partnerships, hide sensitive content, or use News mode.',
  },
  {
    icon: Heart,
    title: 'Wellbeing features',
    description: 'Doom scrolling nudge and break mode help you stay mindful of your screen time.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-16 px-4 bg-gray-950/50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Trust & Calm
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Built for transparency and your wellbeing. Know what you&apos;re seeing and stay in control.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900/50"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition"
          >
            See how it works
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
