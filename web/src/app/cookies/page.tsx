import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';

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
          <BackButton />
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
            <p className="text-gray-300 leading-relaxed mb-4">
              You can manage your cookie preferences at any time using our cookie settings panel.
              This allows you to enable or disable different categories of cookies based on your
              preferences.
            </p>
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-gray-400 text-sm mb-3">
                Click below to open the cookie preferences panel:
              </p>
              <Link
                href="/cookie-preferences"
                className="inline-block px-4 py-2 text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
              >
                Manage Cookie Preferences
              </Link>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              You can also control cookies through your browser settings. Most browsers allow you
              to refuse cookies or delete cookies that have already been set. However, if you block
              essential cookies, some parts of the website may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about our use of cookies, please{' '}
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
