import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'FAQ - Deebop Chat',
  description: 'Frequently asked questions about Deebop Chat.',
};

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Deebop Chat?',
        a: 'Deebop Chat is a messaging app designed specifically for children aged 6-12. It allows kids to message approved friends while giving parents full control and oversight.',
      },
      {
        q: 'Is this social media?',
        a: 'No. Deebop Chat is private messaging only. There are no public profiles, feeds, followers, or discovery features. Children can only communicate with friends that parents have approved.',
      },
      {
        q: 'What ages is Deebop Chat for?',
        a: 'Deebop Chat is designed for children aged 6-12. We offer different default settings based on age bands (6-8, 9-10, 11-12) to provide age-appropriate experiences.',
      },
      {
        q: 'Is Deebop Chat free?',
        a: 'Yes, Deebop Chat is currently free to use for families.',
      },
    ],
  },
  {
    category: 'Safety & Privacy',
    questions: [
      {
        q: 'How do you keep children safe?',
        a: 'Safety is built into every aspect of Deebop Chat. Children can only message pre-approved friends, there are no public profiles or discovery features, and parents have full visibility into their child\'s conversations. Friend requests require approval from both children\'s parents.',
      },
      {
        q: 'Can strangers contact my child?',
        a: 'No. Children can only receive messages from friends that you have explicitly approved. There is no way for strangers to discover or contact your child.',
      },
      {
        q: 'Can my child share photos or their location?',
        a: 'No. Deebop Chat only supports text messages, emojis, and voice notes. Children cannot share photos, videos, or location information.',
      },
      {
        q: 'What data do you collect about my child?',
        a: 'We collect only what\'s necessary: a username, display name (first name or nickname), age band, and their messages. We do not collect real names, photos, location data, or any information that could identify your child outside the app.',
      },
      {
        q: 'Do you sell our data?',
        a: 'Absolutely not. We do not sell, rent, or share personal information with third parties for marketing purposes. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Parental Controls',
    questions: [
      {
        q: 'Do I have to read every message?',
        a: 'Only if you want to. You can choose from three oversight levels: monitor only (messages flow freely, you can review anytime), approve first message (you approve the first message from each new friend), or approve all messages (every message needs your approval).',
      },
      {
        q: 'Can I change the settings later?',
        a: 'Yes, you can change oversight settings at any time. You can also adjust settings differently for each child if you have multiple children on the platform.',
      },
      {
        q: 'What are quiet hours?',
        a: 'Quiet hours let you set times when your child won\'t receive message notifications, such as during school hours or bedtime. Messages are still delivered but notifications are silenced.',
      },
      {
        q: 'Can I see my child\'s conversations?',
        a: 'Yes. Parents can view all of their child\'s conversations and message history at any time through the parent dashboard.',
      },
      {
        q: 'Can I remove a friend from my child\'s account?',
        a: 'Yes. Parents can remove any friend connection at any time from the child\'s settings page.',
      },
    ],
  },
  {
    category: 'Friends & Connections',
    questions: [
      {
        q: 'How does my child add friends?',
        a: 'Your child can search for friends by username. When they send a friend request, it must be approved by you (the sender\'s parent) and then by the recipient\'s parent before they can start messaging.',
      },
      {
        q: 'Why do both parents need to approve?',
        a: 'Dual-parent approval ensures that both families are comfortable with their children connecting. This creates a safer environment where all parents are informed and in agreement.',
      },
      {
        q: 'How do I find my child\'s friends\' usernames?',
        a: 'You\'ll need to get usernames from other parents directly - at school, sports clubs, or through existing relationships. This is intentional: it ensures connections are between children who know each other in real life.',
      },
      {
        q: 'Can my children message each other?',
        a: 'Yes! If you have multiple children on Deebop Chat, they can be friends with each other. Since you\'re the parent of both children, you\'ll approve the friend request for both sides.',
      },
    ],
  },
  {
    category: 'Account Management',
    questions: [
      {
        q: 'Can I have multiple children on one parent account?',
        a: 'Yes. You can add as many children as you need to your parent account, each with their own username, avatar, and settings.',
      },
      {
        q: 'What if I forget my password?',
        a: 'You can reset your parent account password using the email address you registered with. Child account passwords can be reset by the parent from the dashboard.',
      },
      {
        q: 'How do I delete my account?',
        a: 'You can delete your child\'s account or your entire family account from the settings page. Deletion is permanent and removes all associated data within 30 days.',
      },
      {
        q: 'Can both parents have access to the parent account?',
        a: 'Currently, each parent account has one login. We recommend sharing the login credentials with co-parents who need access, or having each parent create their own account with the same children added.',
      },
    ],
  },
];

export default function FAQPage() {
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
          <h1 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-400 mb-10">
            Everything you need to know about Deebop Chat.
          </p>

          <div className="space-y-10">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-semibold text-primary-400 mb-4">
                  {section.category}
                </h2>
                <div className="space-y-3">
                  {section.questions.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-dark-800 rounded-xl border border-dark-700"
                    >
                      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <span className="font-medium text-white pr-4">{item.q}</span>
                        <span className="text-gray-500 group-open:rotate-180 transition-transform">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-4 pb-4">
                        <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-12 p-6 bg-dark-800 rounded-xl border border-dark-700 text-center">
            <h3 className="font-semibold text-white mb-2">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-4">
              We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>
            <Link href="/contact" className="text-primary-400 hover:text-primary-300 font-medium">
              Contact us →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
