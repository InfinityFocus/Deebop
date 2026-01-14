import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { BackButton } from '@/components/shared/BackButton';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Deebop team and help build the future of content sharing.',
};

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Help us build the future of content sharing
          </p>
        </div>

        {/* Why Join */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Why Deebop?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Remote First',
                description: 'Work from anywhere in the world. We believe in async communication and trust.',
              },
              {
                title: 'Competitive Pay',
                description: 'We offer competitive salaries, equity, and comprehensive benefits.',
              },
              {
                title: 'Impact',
                description: 'Join an early-stage team where your work directly shapes the product.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
              >
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>

          <div className="py-16 text-center rounded-xl border border-gray-800 bg-gray-900/30">
            <p className="text-gray-400 mb-4">
              No open positions at the moment.
            </p>
            <p className="text-gray-500 text-sm">
              Interested in joining us?{' '}
              <Link
                href="/contact"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Get in touch
              </Link>
              {' '}and tell us about yourself.
            </p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Ship Fast',
                description: 'We move quickly and iterate based on feedback. Perfect is the enemy of good.',
              },
              {
                title: 'User First',
                description: "Every decision we make starts with what's best for our users.",
              },
              {
                title: 'Stay Curious',
                description: "We're always learning and pushing the boundaries of what's possible.",
              },
              {
                title: 'Be Kind',
                description: "We treat each other with respect and empathy. Life's too short for toxicity.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
              >
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    <Footer />
    </div>
  );
}
