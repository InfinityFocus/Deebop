'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

const faqs = [
  {
    question: 'Is it free?',
    answer: 'Yes! Deebop is free to use. Standard (\u00a35.99/mo) and Pro (\u00a314.99/mo) tiers unlock higher upload limits, 360 panoramas, and ad-free browsing.',
  },
  {
    question: 'What can I post?',
    answer: 'Photos, videos (up to 5 minutes on Pro), 360 panoramas, audio, and text shouts (500 characters).',
  },
  {
    question: 'How are promotions and provenance labelled?',
    answer: 'All content must be labelled as Original, AI Assisted, AI Generated, or Composite. Paid partnerships must be disclosed with a clear label.',
  },
  {
    question: 'How do events and galleries work?',
    answer: 'Create an event, share the invite link, guests RSVP. After the event, all attendees can upload to a shared gallery.',
  },
  {
    question: 'Do I need a mobile app?',
    answer: 'No, Deebop works in your browser on any device. A mobile app may come later.',
  },
  {
    question: 'What is not allowed?',
    answer: 'Illegal content, harassment, spam, and misleading provenance labels. See our Community Guidelines for details.',
  },
  {
    question: 'How do I report content?',
    answer: 'Tap the three-dot menu on any post and select "Report". Our moderation team reviews all reports.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-4 bg-gray-950/50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Got questions? We&apos;ve got answers.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-white font-medium">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={clsx(
                    'text-gray-400 transition-transform',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-200',
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                )}
              >
                <div className="px-5 pb-5 text-gray-400 text-sm">
                  {faq.answer}
                  {faq.question === 'What is not allowed?' && (
                    <Link href="/community-guidelines" className="text-emerald-400 hover:text-emerald-300 ml-1">
                      Read Community Guidelines
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
