'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Coffee, Loader2, Heart } from 'lucide-react';
import { clsx } from 'clsx';

const PRESET_AMOUNTS = [
  { label: '£2', pence: 200 },
  { label: '£5', pence: 500 },
  { label: '£10', pence: 1000 },
];

export function SupportUsCard() {
  const searchParams = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle URL params for success/canceled
  useEffect(() => {
    const donation = searchParams.get('donation');
    if (donation === 'success') {
      setMessage({ type: 'success', text: 'Thank you for your support! Your donation means a lot to us.' });
      // Clean up URL
      window.history.replaceState({}, '', '/settings/subscription');
    } else if (donation === 'canceled') {
      setMessage({ type: 'error', text: 'Donation was canceled. No worries!' });
      // Clean up URL
      window.history.replaceState({}, '', '/settings/subscription');
    }
  }, [searchParams]);

  // Get final amount in pence
  const getFinalAmount = (): number | null => {
    if (selectedAmount !== null) {
      return selectedAmount;
    }
    if (customAmount) {
      const parsed = parseFloat(customAmount);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
        return Math.round(parsed * 100);
      }
    }
    return null;
  };

  const handlePresetClick = (pence: number) => {
    setSelectedAmount(pence);
    setCustomAmount('');
    setMessage(null);
  };

  const handleCustomChange = (value: string) => {
    // Only allow numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return;

    setCustomAmount(cleaned);
    setSelectedAmount(null);
    setMessage(null);
  };

  const handleDonate = async () => {
    const amountPence = getFinalAmount();
    if (!amountPence) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPence }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const data = await res.json();
        if (res.status === 503) {
          setMessage({ type: 'error', text: 'Donations are not available in beta mode.' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to start donation. Please try again.' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = getFinalAmount();
  const isValidAmount = finalAmount !== null && finalAmount >= 100 && finalAmount <= 10000;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
          <Coffee size={20} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Support Deebop</h3>
          <p className="text-sm text-gray-400">Help us build and grow</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-6">
        Enjoying Deebop? Your donation helps keep the platform running and enables us to build new features for everyone.
      </p>

      {/* Success/Error message */}
      {message && (
        <div
          className={clsx(
            'p-4 rounded-lg mb-4 flex items-center gap-3',
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          )}
        >
          {message.type === 'success' && <Heart size={18} className="text-emerald-400 flex-shrink-0" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Preset amounts */}
      <div className="flex gap-3 mb-4">
        {PRESET_AMOUNTS.map(({ label, pence }) => (
          <button
            key={pence}
            onClick={() => handlePresetClick(pence)}
            className={clsx(
              'flex-1 py-3 rounded-lg font-medium transition border-2',
              selectedAmount === pence
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-gray-800 border-gray-700 text-white hover:border-amber-500/50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Or enter a custom amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
          <input
            type="text"
            inputMode="decimal"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="5.00"
            className={clsx(
              'w-full pl-8 pr-4 py-3 bg-gray-800 border-2 rounded-lg text-white placeholder-gray-500 transition',
              customAmount && selectedAmount === null
                ? 'border-amber-500'
                : 'border-gray-700 focus:border-amber-500/50'
            )}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Min £1, max £100</p>
      </div>

      {/* Donate button */}
      <button
        onClick={handleDonate}
        disabled={!isValidAmount || loading}
        className={clsx(
          'w-full py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2',
          isValidAmount && !loading
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <Coffee size={18} />
            {isValidAmount
              ? `Buy us a coffee (£${(finalAmount! / 100).toFixed(2)})`
              : 'Select an amount'}
          </>
        )}
      </button>

      {/* Small print */}
      <p className="text-xs text-gray-500 text-center mt-4">
        One-time donation. No subscription required.
      </p>
    </div>
  );
}
