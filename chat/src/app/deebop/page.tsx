import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Image as ImageIcon, Video, Globe, Music } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'More from Deebop - Deebop Chat',
  description: 'Discover Deebop, our creative social platform for sharing photos, videos, and more.',
};

export default function DeebopPage() {
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
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-4">More from Deebop</h1>
            <p className="text-lg text-gray-300">
              Deebop Chat is part of the Deebop family of products.
            </p>
          </div>

          {/* Deebop.com Card */}
          <div className="bg-gradient-to-br from-primary-500/10 to-cyan-500/10 rounded-2xl border border-primary-500/20 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold logo-shimmer">Deebop</h2>
                <p className="text-gray-400">Creative Social Platform</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Deebop is a social platform where creators share their work and connect with
              audiences. Share photos, videos, 360° panoramas, and audio content with a
              community that celebrates creativity.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <FeatureItem icon={<ImageIcon size={20} />} label="Photos" />
              <FeatureItem icon={<Video size={20} />} label="Videos" />
              <FeatureItem icon={<Globe size={20} />} label="360° Panoramas" />
              <FeatureItem icon={<Music size={20} />} label="Audio" />
            </div>

            <a
              href="https://deebop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              Visit Deebop.com
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Deebop Chat Summary */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <div className="flex items-center gap-4 mb-6">
              <Image
                src="/icon.png"
                alt="Deebop Chat"
                width={64}
                height={64}
                className="rounded-2xl"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">Deebop Chat</h2>
                <p className="text-gray-400">Safe Messaging for Kids</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              You&apos;re already here! Deebop Chat is our dedicated messaging app for children
              aged 6-12, designed with safety and parental control at its core. It&apos;s
              completely separate from our main social platform, ensuring a protected
              environment for young users.
            </p>

            <Link href="/" className="text-primary-400 hover:text-primary-300 font-medium">
              ← Back to Deebop Chat
            </Link>
          </div>

          {/* Why Two Products */}
          <div className="mt-8 p-6 bg-dark-800/50 rounded-xl border border-dark-700">
            <h3 className="font-semibold text-white mb-3">Why separate products?</h3>
            <p className="text-gray-400 text-sm">
              We believe children deserve purpose-built technology, not watered-down versions
              of adult platforms. Deebop Chat was created specifically for kids, with safety
              features designed from the ground up rather than added as an afterthought.
              When your children are ready for broader social media, Deebop will be there
              for them.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-300">
      <div className="text-primary-400">{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
