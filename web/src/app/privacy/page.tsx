import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { BackButton } from '@/components/shared/BackButton';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Deebop - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: December 30, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              At Deebop, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our service.
              Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-3 mt-6">Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Account information (email, username, password)</li>
              <li>Profile information (display name, bio, avatar)</li>
              <li>Content you upload (images, videos, panoramas, text)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Communications with us</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, features used)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in these circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>With your consent</li>
              <li>With service providers who assist our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>In connection with a merger or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information. However, no method of transmission over the Internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Delete your personal information</li>
              <li>Object to processing of your information</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use cookies and similar technologies to provide functionality, remember your
              preferences, and analyze how our service is used. You can control cookies through
              your browser settings, but disabling them may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed">
              Our service may contain links to third-party websites and services. We are not
              responsible for the privacy practices of these third parties. We encourage you
              to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Deebop is not intended for children under 13. We do not knowingly collect
              personal information from children under 13. If we learn we have collected
              such information, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than
              your own. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated"
              date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy, please{' '}
              <Link href="/contact" className="text-emerald-400 hover:text-emerald-300">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    <Footer />
    </div>
  );
}
