import Footer from '@/components/layout/Footer';
import { BackButton } from '@/components/shared/BackButton';

export const metadata = {
  title: 'Community Guidelines - Deebop',
  description: 'Community guidelines and content policies for Deebop.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-gray-400 mb-8">Last updated: January 8, 2026</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-300">
              Deebop is built on the principle that creators should be able to share their work in a calm,
              supportive environment. These guidelines help us maintain a platform where everyone can
              express themselves authentically while respecting others.
            </p>
          </section>

          {/* Core Principles */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Core Principles</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-2">Be Authentic</h3>
                <p className="text-gray-400 text-sm">
                  Use accurate provenance labels. If your content is AI-generated, AI-assisted, or
                  composite, label it correctly. Misleading labels undermine trust.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-2">Be Respectful</h3>
                <p className="text-gray-400 text-sm">
                  Even without comments, your content choices affect others. Don&apos;t create content
                  designed to harass, bully, or target individuals.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-white mb-2">Be Transparent</h3>
                <p className="text-gray-400 text-sm">
                  Disclose paid partnerships and sponsorships. Your audience deserves to know when
                  content is promotional.
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Prohibited Content</h2>
            <p className="text-gray-300 mb-4">
              The following content is not allowed on Deebop and will result in removal and potential
              account suspension:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li><strong className="text-white">Illegal content</strong> - Content that violates laws in your jurisdiction</li>
              <li><strong className="text-white">Harassment and bullying</strong> - Content targeting individuals with abuse, threats, or intimidation</li>
              <li><strong className="text-white">Hate speech</strong> - Content promoting hatred based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
              <li><strong className="text-white">Violence and gore</strong> - Gratuitous violence, graphic injury, or content glorifying violence</li>
              <li><strong className="text-white">Sexual exploitation</strong> - Non-consensual intimate imagery, sexual content involving minors, or sexual exploitation</li>
              <li><strong className="text-white">Spam and manipulation</strong> - Repetitive content, fake engagement, or deceptive practices</li>
              <li><strong className="text-white">Impersonation</strong> - Pretending to be someone else or a brand without authorisation</li>
              <li><strong className="text-white">Misinformation</strong> - Deliberately false information that could cause harm</li>
              <li><strong className="text-white">Misleading provenance</strong> - Intentionally mislabelling AI-generated content as original, or vice versa</li>
            </ul>
          </section>

          {/* Sensitive Content */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Sensitive Content</h2>
            <p className="text-gray-300 mb-4">
              Some content is allowed but should be marked as sensitive:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Suggestive or adult themes (e.g., lingerie, alcohol, smoking/vaping, gambling, stunts)</li>
              <li>Graphic content that serves educational or newsworthy purposes</li>
              <li>Content depicting legal but potentially disturbing topics</li>
            </ul>
            <p className="text-gray-300 mt-4">
              <strong className="text-white">How sensitive content works:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 mt-2">
              <li>Sensitive content is <strong className="text-white">visible by default</strong> for users 16 and over</li>
              <li>Users under 16 do not see content marked as sensitive</li>
              <li>Any user can choose to hide sensitive content in their <a href="/settings/privacy" className="text-emerald-400 hover:text-emerald-300">Explore filters</a></li>
            </ul>
          </section>

          {/* Provenance Labels */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Provenance Labels</h2>
            <p className="text-gray-300 mb-4">
              All content must be accurately labelled with one of the following:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-emerald-400 mb-1">Original</h3>
                <p className="text-gray-400 text-sm">
                  Created entirely by you without AI generation tools. Editing and post-processing are fine.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-cyan-400 mb-1">AI Assisted</h3>
                <p className="text-gray-400 text-sm">
                  Primarily human-created but with AI tool assistance (e.g., AI-powered editing, enhancement, or partial generation).
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-purple-400 mb-1">AI Generated</h3>
                <p className="text-gray-400 text-sm">
                  Primarily or entirely created by AI tools (e.g., text-to-image, text-to-video generators).
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-yellow-400 mb-1">Composite / Edited</h3>
                <p className="text-gray-400 text-sm">
                  Significantly edited, combined from multiple sources, or manipulated beyond basic adjustments.
                </p>
              </div>
            </div>
          </section>

          {/* Paid Partnerships */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Paid Partnerships</h2>
            <p className="text-gray-300 mb-4">
              If you receive compensation (money, free products, or other benefits) for creating or sharing content,
              you must enable the &quot;Paid Partnership&quot; label. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Sponsored posts</li>
              <li>Brand ambassador content</li>
              <li>Affiliate marketing (when you earn commission)</li>
              <li>Gifted products that you were asked to feature</li>
            </ul>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Reporting Violations</h2>
            <p className="text-gray-300 mb-4">
              If you see content that violates these guidelines:
            </p>
            <ol className="list-decimal list-inside text-gray-400 space-y-2">
              <li>Tap the three-dot menu on the post</li>
              <li>Select &quot;Report&quot;</li>
              <li>Choose the appropriate violation category</li>
              <li>Add any additional context (optional)</li>
            </ol>
            <p className="text-gray-300 mt-4">
              Our moderation team reviews all reports and takes action within 24-48 hours.
            </p>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Enforcement</h2>
            <p className="text-gray-300 mb-4">
              Violations may result in:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li><strong className="text-white">Content removal</strong> - Violating content is removed</li>
              <li><strong className="text-white">Warning</strong> - First-time or minor violations may receive a warning</li>
              <li><strong className="text-white">Temporary suspension</strong> - Repeated or serious violations</li>
              <li><strong className="text-white">Permanent ban</strong> - Severe or ongoing violations</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We consider context and intent when enforcing these guidelines. If you believe your content
              was removed in error, you can appeal through the notification you receive.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
            <p className="text-gray-300">
              If you have questions about these guidelines or need clarification, please{' '}
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
