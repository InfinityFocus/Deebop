'use client';

import { useState } from 'react';
import Footer from '@/components/layout/Footer';
import { BackButton } from '@/components/shared/BackButton';
import { Send, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, honeypot }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('general');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-400">
            We&apos;d love to hear from you
          </p>
        </div>

        {/* Contact Form */}
        <div className="w-full">
          {success ? (
            <div className="p-8 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
              <p className="text-gray-400 mb-6">
                Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
              {/* Honeypot field - hidden from users */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Support / Help</option>
                    <option value="account">Account / Password Help</option>
                    <option value="feedback">Feedback</option>
                    <option value="bug">Report a Bug</option>
                    <option value="business">Business / Partnerships</option>
                    <option value="privacy">Privacy Concerns</option>
                    <option value="legal">Legal</option>
                    <option value="careers">Careers</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Response Time */}
          <div className="mt-6 p-4 rounded-lg border border-gray-800 bg-gray-900/30 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Clock size={16} />
            <span>We typically respond within 24-48 hours during business days.</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
