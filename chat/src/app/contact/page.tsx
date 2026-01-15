import Link from 'next/link';
import Image from 'next/image';
import { Mail, MessageCircle } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact - Deebop Chat',
  description: 'Get in touch with the Deebop Chat team.',
};

export default function ContactPage() {
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
          <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>

          <p className="text-lg text-gray-300 mb-8">
            Have a question, suggestion, or need help? We&apos;d love to hear from you.
          </p>

          <div className="space-y-4">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="text-primary-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Email Support</h2>
                  <p className="text-gray-400 mb-3">
                    For general enquiries and support questions.
                  </p>
                  <a
                    href="mailto:support@deebop.com"
                    className="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    support@deebop.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="text-cyan-400" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Feedback</h2>
                  <p className="text-gray-400 mb-3">
                    Help us improve Deebop Chat by sharing your thoughts and suggestions.
                  </p>
                  <a
                    href="mailto:feedback@deebop.com"
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    feedback@deebop.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-dark-800/50 rounded-xl border border-dark-700">
            <h3 className="font-semibold text-white mb-2">Response Time</h3>
            <p className="text-gray-400 text-sm">
              We aim to respond to all enquiries within 24-48 hours during business days.
              For urgent safety concerns, please include &quot;URGENT&quot; in your subject line.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
