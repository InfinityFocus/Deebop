import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy - Deebop Chat',
  description: 'Privacy Policy for Deebop Chat.',
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Introduction</h2>
              <p>
                At Deebop Chat, protecting children&apos;s privacy is our top priority. This policy
                explains what information we collect, how we use it, and how we keep it safe.
                We comply with applicable child privacy laws including COPPA and UK GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">Parent Accounts</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email address (for account login and notifications)</li>
                <li>Password (stored securely using encryption)</li>
                <li>Display name (optional)</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-4 mb-2">Child Accounts</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Username (chosen by parent)</li>
                <li>Display name (first name or nickname only)</li>
                <li>Age band (6-8, 9-10, or 11-12)</li>
                <li>Avatar selection</li>
                <li>Messages sent to approved friends</li>
              </ul>

              <p className="mt-4">
                <strong className="text-white">We do NOT collect:</strong> Real names of children,
                photos of children, location data, phone numbers, or school information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How We Use Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide the messaging service</li>
                <li>To enable parental oversight features</li>
                <li>To send approval notifications to parents</li>
                <li>To improve and maintain the service</li>
                <li>To ensure safety and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Information Sharing</h2>
              <p>
                We do not sell, rent, or share personal information with third parties for
                marketing purposes. Information may only be shared:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Between connected friends and their parents (as part of the service)</li>
                <li>With service providers who help us operate the platform (under strict agreements)</li>
                <li>When required by law or to protect safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>All data is encrypted in transit (HTTPS)</li>
                <li>Passwords are hashed using secure algorithms</li>
                <li>Access to data is restricted and logged</li>
                <li>Regular security reviews and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
              <p>
                We retain account data while the account is active. Messages are retained to
                enable parental monitoring. When an account is deleted, associated data is
                permanently removed within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Parental Rights</h2>
              <p>
                Parents have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Review their child&apos;s account information</li>
                <li>Review messages sent and received by their child</li>
                <li>Delete their child&apos;s account at any time</li>
                <li>Request a copy of their family&apos;s data</li>
                <li>Withdraw consent and close all accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Cookies</h2>
              <p>
                We use essential cookies only to keep you logged in and maintain your session.
                We do not use tracking cookies or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. We will notify parents of
                significant changes via email before they take effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
              <p>
                For privacy-related questions or to exercise your rights, contact us at{' '}
                <a href="mailto:privacy@deebop.com" className="text-primary-400 hover:text-primary-300">
                  privacy@deebop.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
