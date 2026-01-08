import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for using Deebop.',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={20} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: December 30, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Deebop ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Deebop is a social media platform that allows users to share images, videos,
              360-degree panoramas, and short text posts ("Shouts"). The Service includes
              free and premium subscription tiers with varying features and limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You retain ownership of content you post on Deebop. By posting content, you grant
              us a non-exclusive, worldwide, royalty-free license to use, display, and distribute
              your content on the Service.
            </p>
            <p className="text-gray-300 leading-relaxed">
              You are solely responsible for your content and must ensure it does not violate
              any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Prohibited Content</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You may not post content that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Is illegal, harmful, or promotes violence</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains malware or malicious code</li>
              <li>Is spam or deceptive in nature</li>
              <li>Harasses or threatens others</li>
              <li>Contains explicit content without proper labeling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Subscription Services</h2>
            <p className="text-gray-300 leading-relaxed">
              Deebop offers Standard and Pro subscription tiers with additional features.
              Subscriptions are billed monthly and renew automatically unless cancelled.
              Refunds are provided in accordance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms.
              You may delete your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              The Service is provided "as is" without warranties of any kind. We do not
              guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, Deebop shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your
              use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update these terms from time to time. We will notify users of significant
              changes via email or through the Service. Continued use after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@deebop.com" className="text-purple-400 hover:text-purple-300">
                legal@deebop.com
              </a>
            </p>
          </section>
        </div>
      </main>
    <Footer />
    </div>
  );
}
