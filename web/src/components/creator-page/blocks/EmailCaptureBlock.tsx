'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import type { EmailCaptureBlockData } from '@/types/creator-page';

interface EmailCaptureBlockProps {
  data: EmailCaptureBlockData | Record<string, unknown>;
  pageId: string;
}

export function EmailCaptureBlock({ data, pageId }: EmailCaptureBlockProps) {
  const blockData = data as EmailCaptureBlockData;
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !consent) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/creator-page/email-signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          email,
          consentText: blockData.consentText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setEmail('');
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">You&apos;re subscribed!</h3>
        <p className="text-gray-400">Thanks for signing up.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      {/* Heading */}
      {blockData.heading && (
        <h3 className="text-xl font-semibold text-white mb-2 text-center">
          {blockData.heading}
        </h3>
      )}

      {/* Description */}
      {blockData.description && (
        <p className="text-gray-400 text-center mb-4">{blockData.description}</p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="relative">
          <Mail
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={blockData.placeholder || 'Enter your email'}
            required
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-800"
          />
          <span className="text-sm text-gray-400">{blockData.consentText}</span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email || !consent}
          className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Mail size={20} />
              {blockData.buttonLabel || 'Subscribe'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
