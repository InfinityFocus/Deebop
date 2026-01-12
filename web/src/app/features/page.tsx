import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import {
  Image, Video, Compass, MessageSquare, Heart, Bookmark, Share2, Shield,
  FolderOpen, Clock, Rocket, BadgeCheck, Users, Hash, Bell, Mic, Calendar,
  Layout, DollarSign, ShieldAlert, Repeat, UserCircle2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover all the features Deebop has to offer for sharing your content.',
};

const contentTypes = [
  {
    icon: MessageSquare,
    title: 'Shouts',
    description: 'Share quick thoughts and updates with your followers. Up to 500 characters of pure expression.',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
  {
    icon: Image,
    title: 'Images',
    description: 'Upload and share high-quality photos and artwork. Support for various formats and sizes based on your tier.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Video,
    title: 'Videos',
    description: 'Share short-form video content. From quick clips to longer formats for Pro users.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Compass,
    title: '360 Panoramas',
    description: 'Create immersive experiences with 360-degree panoramas. Available for Pro subscribers.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Mic,
    title: 'Audio',
    description: 'Record and share audio clips with waveform visualization. Tier-based recording from 1 to 30 minutes.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
];

const creatorTools = [
  {
    icon: UserCircle2,
    title: 'Multiple Profiles',
    description: 'Manage up to 5 separate profiles under one account. Keep personal, professional, and creative identities distinct with their own followers and content.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: FolderOpen,
    title: 'Collaborative Albums',
    description: 'Create shared albums and invite others as Owner, Co-Owner, or Contributor. Perfect for group projects and collaborations.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Clock,
    title: 'Scheduled Drops',
    description: 'Schedule content for the perfect moment. Build anticipation with countdowns and optional teasers.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Rocket,
    title: 'Post Boosts',
    description: 'Promote your content to reach new audiences. Set your budget and target specific regions.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: BadgeCheck,
    title: 'Provenance Labels',
    description: 'Transparent content labeling. Mark your work as Original, AI-Assisted, AI-Generated, or Composite.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Calendar,
    title: 'Events',
    description: 'Plan gatherings with RSVP tracking, shareable invite links, and private photo galleries for attendees.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Layout,
    title: 'Creator Page',
    description: 'Build your personal link-in-bio page with customizable blocks, analytics, and email signups. Standard and Pro tiers.',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: DollarSign,
    title: 'Paid Partnership Disclosure',
    description: 'Transparently label sponsored content and paid partnerships to maintain trust with your audience.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: ShieldAlert,
    title: 'Sensitive Content Controls',
    description: 'Mark content with mature themes. Age-appropriate filtering protects younger users automatically.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
];

const discovery = [
  {
    icon: Users,
    title: 'Audience Groups',
    description: 'Create custom groups to share content with specific followers. Perfect for exclusive updates.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Hash,
    title: 'Hashtag Explore',
    description: 'Discover trending content through hashtags. Find and connect with creators in your niche.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Stay updated with real-time notifications for likes, follows, shares, and mentions.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
];

const engagement = [
  {
    icon: Heart,
    title: 'Likes',
    description: 'Show appreciation for content you enjoy with a simple like.',
  },
  {
    icon: Repeat,
    title: 'Reposts',
    description: 'Amplify content you love by sharing it directly to follower feeds.',
  },
  {
    icon: Bookmark,
    title: 'Saves',
    description: 'Bookmark posts to revisit later in your personal collection.',
  },
  {
    icon: Share2,
    title: 'Shares',
    description: 'Share content externally via link or to other platforms.',
  },
];

export default function FeaturesPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Features</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to share your content with the world
          </p>
        </div>

        {/* Content Types */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Content Types</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {contentTypes.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon size={24} className={feature.color} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Creator Tools */}
        <section id="creator-tools" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-8">Creator Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {creatorTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
                >
                  <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                    <Icon size={24} className={tool.color} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                  <p className="text-gray-400">{tool.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Discovery */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Discovery & Engagement</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {discovery.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
                >
                  <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-4`}>
                    <Icon size={24} className={item.color} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Engagement */}
        <section id="simple-interactions" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-8">Simple Interactions</h2>
          <p className="text-gray-400 mb-6">
            No comments, no drama. Simple, focused engagement:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {engagement.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center"
                >
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 mx-auto">
                    <Icon size={24} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-16">
          <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Privacy First</h2>
                <p className="text-gray-400">
                  We don&apos;t sell your data or track you across the web. Your content,
                  your audience, your privacy. Set your profile to private and control
                  who sees your content.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-yellow-500/10 to-cyan-500/10 border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-6">
            Create your account and start sharing today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Create Account
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-gray-600 px-8 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
