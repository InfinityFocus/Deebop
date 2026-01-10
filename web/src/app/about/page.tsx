import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import { Users, Zap, Shield, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Deebop - the social platform for sharing images, videos, and 360 panoramas.',
};

const values = [
  {
    icon: Zap,
    title: 'Content First',
    description: 'No comments, no drama. Just pure content. We believe in letting your work speak for itself.',
  },
  {
    icon: Shield,
    title: 'Privacy Focused',
    description: 'Your data belongs to you. We never sell your information or track you across the web.',
  },
  {
    icon: Globe,
    title: 'Global Community',
    description: 'Connect with creators worldwide. Share your perspective through images, videos, shouts (but not too loud), and immersive 360 experiences.',
  },
  {
    icon: Users,
    title: 'Creator Friendly',
    description: 'Fair monetization, no algorithmic suppression. Your content reaches your followers.',
  },
];

export default function AboutPage() {
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
            About{' '}
            <span className="logo-shimmer">
              Deebop
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A new kind of social platform designed for creators who want to share
            their vision without the noise.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 text-lg leading-relaxed">
              Deebop was created with a simple belief: social media should be about
              sharing meaningful content, not endless scrolling through comments and
              arguments. We've stripped away the noise to create a platform where
              your images, videos, and immersive 360 panoramas take center stage.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mt-4">
              Whether you're a photographer, videographer, digital artist, or just
              someone who loves capturing moments, Deebop gives you the tools to
              share your perspective with the world.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">What We Stand For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
                >
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Content Types */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">What You Can Share</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Shouts', desc: 'Quick thoughts and updates' },
              { name: 'Images', desc: 'Photos and artwork' },
              { name: 'Videos', desc: 'Short-form video content' },
              { name: 'Audio', desc: 'Voice clips and recordings' },
              { name: '360 Panoramas', desc: 'Immersive experiences' },
              { name: 'Events', desc: 'Plan and share gatherings' },
            ].map((type) => (
              <div
                key={type.name}
                className="p-4 rounded-lg bg-gray-800 text-center"
              >
                <h4 className="font-semibold mb-1">{type.name}</h4>
                <p className="text-sm text-gray-400">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-yellow-500/10 to-cyan-500/10 border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Ready to join?</h2>
          <p className="text-gray-400 mb-6">
            Start sharing your content with the world today.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            Create Account
          </Link>
        </section>
      </main>
    <Footer />
    </div>
  );
}
