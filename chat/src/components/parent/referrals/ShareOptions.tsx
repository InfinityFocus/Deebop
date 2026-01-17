'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, MessageCircle, Mail, Share2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface ShareOptionsProps {
  referralUrl: string;
  code: string;
}

export function ShareOptions({ referralUrl, code }: ShareOptionsProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Join me on Deebop Chat! It's a safe messaging app for our kids to stay in touch with friends. Use my invite link: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Join me on Deebop Chat');
    const body = encodeURIComponent(
      `Hi!\n\nI've been using Deebop Chat - a safe messaging app for kids - and thought you might be interested.\n\nUse my invite link to sign up: ${referralUrl}\n\nWhen you subscribe, I'll get a free month as a thank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Deebop Chat',
          text: 'A safe messaging app for kids to stay connected',
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral code display */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="text-sm text-gray-400 mb-1">Your referral code</div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-white tracking-wider">
            {code}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          onClick={handleWhatsApp}
          className="flex-col py-4 h-auto"
        >
          <MessageCircle className="w-5 h-5 mb-1 text-green-400" />
          <span className="text-xs">WhatsApp</span>
        </Button>

        <Button
          variant="secondary"
          onClick={handleEmail}
          className="flex-col py-4 h-auto"
        >
          <Mail className="w-5 h-5 mb-1 text-blue-400" />
          <span className="text-xs">Email</span>
        </Button>

        {canShare && (
          <Button
            variant="secondary"
            onClick={handleShare}
            className="flex-col py-4 h-auto"
          >
            <Share2 className="w-5 h-5 mb-1 text-purple-400" />
            <span className="text-xs">Share</span>
          </Button>
        )}
      </div>
    </div>
  );
}
