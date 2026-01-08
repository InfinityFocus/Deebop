'use client';

import { Calendar, Users, Images, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

const steps = [
  {
    icon: Calendar,
    title: 'Create event + invite link',
    description: 'Set up your event with date, location, and details. Get a shareable invite link.',
  },
  {
    icon: Users,
    title: 'Guests RSVP',
    description: 'Invitees respond with Attend or Maybe. Track who\'s coming.',
  },
  {
    icon: Images,
    title: 'Share to one gallery',
    description: 'After the event, everyone uploads to a shared gallery. All memories in one place.',
  },
];

export default function EventsSection() {
  const { trackCta } = useHomepageAnalytics();

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Events + Shared Galleries
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Plan gatherings, collect RSVPs, and create collaborative photo galleries where everyone contributes.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm">
                  {index + 1}
                </div>

                <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 h-full">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>

                {/* Arrow connector (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight size={20} className="text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            onClick={() => trackCta('create_event')}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400"
          >
            Create an event
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
