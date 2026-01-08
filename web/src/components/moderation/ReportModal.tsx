'use client';

import { useState } from 'react';
import { X, Loader2, Flag, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface ReportModalProps {
  postId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Unwanted commercial content or repetitive posts' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted attacks' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Content promoting hatred against groups' },
  { id: 'violence', label: 'Violence', description: 'Graphic violence or threats of harm' },
  { id: 'nudity', label: 'Nudity/Sexual', description: 'Inappropriate sexual content' },
  { id: 'false_information', label: 'False Information', description: 'Misleading or fake content' },
  { id: 'copyright', label: 'Copyright', description: 'Unauthorized use of copyrighted material' },
  { id: 'other', label: 'Other', description: 'Something else not listed above' },
];

export function ReportModal({ postId, onClose, onSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess(true);
      onSuccess?.();

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <h2 id="report-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
            <Flag size={24} className="text-red-400" aria-hidden="true" />
            Report Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close report modal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Report Submitted</h3>
              <p className="text-gray-400">
                Thanks for helping keep our community safe. We'll review this report soon.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-400 mb-4">
                Why are you reporting this post?
              </p>

              {/* Reason Selection */}
              <fieldset className="space-y-2 mb-4">
                <legend className="sr-only">Report reason</legend>
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={clsx(
                      'w-full p-3 rounded-lg border text-left transition min-h-[60px] touch-manipulation',
                      selectedReason === reason.id
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    )}
                    role="radio"
                    aria-checked={selectedReason === reason.id}
                  >
                    <p className="font-medium text-white">{reason.label}</p>
                    <p className="text-sm text-gray-400">{reason.description}</p>
                  </button>
                ))}
              </fieldset>

              {/* Additional Details */}
              {selectedReason && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide more context about why you're reporting this post..."
                    className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">{details.length}/500</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Flag size={20} />
                    Submit Report
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                False reports may result in action against your account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
