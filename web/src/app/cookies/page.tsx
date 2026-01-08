import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for Deebop - how we use cookies and similar technologies.',
};

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: December 30, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p className="text-gray-300 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit a website.
              They are widely used to make websites work more efficiently and provide information
              to the website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Essential Cookies</h3>
            <p className="text-gray-300 leading-relaxed">
              These cookies are necessary for the website to function properly. They enable
              core functionality such as security, account authentication, and remembering
              your preferences.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Analytics Cookies</h3>
            <p className="text-gray-300 leading-relaxed">
              We use analytics cookies to understand how visitors interact with our website.
              This helps us improve our services and user experience.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Functional Cookies</h3>
            <p className="text-gray-300 leading-relaxed">
              These cookies enable enhanced functionality and personalization, such as
              remembering your display preferences and settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              Most web browsers allow you to control cookies through their settings. You can
              set your browser to refuse cookies or delete cookies that have already been set.
              However, if you block essential cookies, some parts of the website may not function
              properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@deebop.com" className="text-purple-400 hover:text-purple-300">
                privacy@deebop.com
              </a>
            </p>
          </section>
        </div>
      </main>
    <Footer />
    </div>
  );
}
