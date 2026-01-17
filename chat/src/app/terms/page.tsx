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
              <h2 className="text-xl font-semibold text-white mb-3">5. Subscription and Payments</h2>
              <p className="mb-3">
                Deebop Chat offers a 14-day free trial, after which a paid subscription is required
                to continue using the service. Pricing is as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Monthly:</strong> £3.99 per month, billed monthly</li>
                <li><strong>Annual:</strong> £39 per year, billed annually (approximately 18% savings)</li>
              </ul>
              <p className="mb-3">
                Subscriptions automatically renew at the end of each billing period. We will send you
                email reminders 3 days and 1 day before your subscription renews.
              </p>
              <p>
                You may cancel your subscription at any time from your parent dashboard. Upon cancellation,
                you will retain access until the end of your current billing period. No partial refunds
                are provided for unused time, except as required by law (see Section 6).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Right to Cancel (Cooling-Off Period)</h2>
              <p className="mb-3">
                Under the Consumer Contracts Regulations 2013, you have the right to cancel your subscription
                within 14 days of your initial purchase or annual renewal (&quot;cooling-off period&quot;).
              </p>
              <p className="mb-3">
                <strong>How to exercise this right:</strong> Email{' '}
                <a href="mailto:support@deebop.com" className="text-primary-400 hover:text-primary-300">
                  support@deebop.com
                </a>{' '}
                with your account email and a request to cancel within the cooling-off period.
              </p>
              <p className="mb-3">
                <strong>Refund calculation:</strong> If you have used the service during the cooling-off period,
                you will receive a pro-rata refund calculated as: subscription fee minus (daily rate × days used).
                For example, if you cancel a monthly subscription (£3.99) after 5 days of use, your refund would
                be £3.99 - (£3.99 ÷ 30 × 5) = £3.33.
              </p>
              <p className="mb-3">
                Refunds will be processed within 14 days via the original payment method.
              </p>
              <p>
                By using the service immediately after purchase, you acknowledge that you are requesting immediate
                access and accept that your right to a full refund may be affected proportionally to your usage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Privacy</h2>
              <p>
                Your use of Deebop Chat is also governed by our{' '}
                <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Content Ownership</h2>
              <p>
                Users retain ownership of content they create. By using Deebop Chat, you grant
                us a limited licence to store and transmit your content as necessary to provide
                the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Service Modifications</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service
                at any time. We will provide reasonable notice of significant changes when possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
              <p>
                We may terminate or suspend accounts that violate these terms. Parents may
                delete their family&apos;s accounts at any time through the settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Limitation of Liability</h2>
              <p>
                Deebop Chat is provided &quot;as is&quot; without warranties of any kind. We are not
                liable for any damages arising from the use of our service, to the maximum
                extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
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
