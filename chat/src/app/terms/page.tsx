import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service - Deebop Chat',
  description: 'Terms of Service for Deebop Chat.',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Deebop Chat, you agree to be bound by these Terms of Service.
                If you are a parent or guardian creating an account for a child, you agree to these
                terms on behalf of yourself and your child.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
              <p>
                Deebop Chat is designed for children aged 6-12 under parental supervision.
                Parent accounts must be created by individuals who are at least 18 years old.
                Child accounts must be created and managed by a parent or legal guardian.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Account Responsibilities</h2>
              <p>
                Parents are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Maintaining the security of account credentials</li>
                <li>Supervising their child&apos;s use of the service</li>
                <li>Approving friend connections and messages as configured</li>
                <li>Ensuring their child understands appropriate online behaviour</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
              <p>
                Users agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Share inappropriate content</li>
                <li>Harass, bully, or intimidate other users</li>
                <li>Attempt to bypass parental controls</li>
                <li>Share personal information that could identify a child&apos;s location</li>
                <li>Use the service for any illegal purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Privacy</h2>
              <p>
                Your use of Deebop Chat is also governed by our{' '}
                <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Content Ownership</h2>
              <p>
                Users retain ownership of content they create. By using Deebop Chat, you grant
                us a limited licence to store and transmit your content as necessary to provide
                the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Service Modifications</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service
                at any time. We will provide reasonable notice of significant changes when possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
              <p>
                We may terminate or suspend accounts that violate these terms. Parents may
                delete their family&apos;s accounts at any time through the settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
              <p>
                Deebop Chat is provided &quot;as is&quot; without warranties of any kind. We are not
                liable for any damages arising from the use of our service, to the maximum
                extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
              <p>
                For questions about these terms, please contact us at{' '}
                <a href="mailto:legal@deebop.com" className="text-primary-400 hover:text-primary-300">
                  legal@deebop.com
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
