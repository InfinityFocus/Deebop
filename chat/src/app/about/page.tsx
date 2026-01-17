import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Users, Monitor } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About - Deebop Chat',
  description: 'Learn about Deebop Chat, a safe messaging app for kids aged 6-12 with parental controls.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-dark-900">
      {/* Header */}
      <header className="py-4 px-4 border-b border-dark-700">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Deebop Chat"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold logo-shimmer">Deebop Chat</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">About Deebop Chat</h1>

          <div className="prose prose-invert max-w-none space-y-6">
            <p className="text-lg text-gray-300">
              Deebop Chat is a messaging app designed specifically for children aged 6–12.
              It gives kids a safe way to stay connected with real friends, while giving
              parents clarity, oversight, and control.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-300">
              We believe children should be able to communicate with friends without being
              exposed to the pressures and risks of traditional social media.
            </p>
            <p className="text-gray-300">
              Deebop Chat bridges the gap between complete restriction and unrestricted access,
              offering age-appropriate independence with parental oversight that grows with your child.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">What Makes Us Different</h2>

            <div className="grid gap-4 mt-6">
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Safety by design</h3>
                    <p className="text-sm text-gray-400">
                      No public profiles, no discovery, no strangers. Children can only
                      message friends their parents approve.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">A calmer approach to oversight</h3>
                    <p className="text-sm text-gray-400">
                      Parents can monitor messages, approve the first message from new friends,
                      or approve every message. Control without constant supervision.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Monitor className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Works beyond the phone</h3>
                    <p className="text-sm text-gray-400">
                      Deebop Chat is designed to work on desktops, Chromebooks, and shared
                      family devices, not just smartphones.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">No ads. No algorithms.</h3>
                    <p className="text-sm text-gray-400">
                      We don&apos;t show ads to children or use feeds designed to maximise engagement.
                      Messages appear because people send them, not because an algorithm decided.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Our Commitment</h2>
            <p className="text-gray-300">
              We&apos;re committed to building technology that supports healthy childhood development.
            </p>
            <p className="text-gray-300">
              Deebop Chat is designed to strengthen real friendships, respect family boundaries,
              and give parents confidence, not anxiety.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/parent/register"
              className="btn btn-primary"
            >
              Get started with Deebop Chat
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
