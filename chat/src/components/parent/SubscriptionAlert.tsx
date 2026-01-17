'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/shared';
import type { SubscriptionAccess, SubscriptionStatus } from '@/types';

interface Props {
  className?: string;
}

export function SubscriptionAlert({ className = '' }: Props) {
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch('/api/parent/subscription/access');
        const data = await response.json();

        if (data.success) {
          setAccess(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccess();
  }, []);

  if (isLoading || !access) {
    return null;
  }

  // Free account - show small badge only
  if (access.status === 'free') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm ${className}`}>
        <Gift size={14} />
        <span>Free account</span>
      </div>
    );
  }

  // Active subscription with no warnings - don't show anything
  if (access.status === 'active' && !access.showRenewalWarning && !access.showUrgentWarning) {
    return null;
  }

  // Determine alert style and content
  const alertConfig = getAlertConfig(access);

  if (!alertConfig) {
    return null;
  }

  const { style, icon: Icon, title, description, showAction, actionText } = alertConfig;

  const styleClasses = {
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${styleClasses[style]} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white">{title}</h3>
          <p className="text-sm mt-1 opacity-90">{description}</p>

          {showAction && (
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  // TODO: Navigate to subscription page when implemented
                  console.log('Navigate to subscription page');
                }}
              >
                {actionText || 'Subscribe now'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AlertConfig {
  style: 'green' | 'yellow' | 'red';
  icon: typeof AlertCircle;
  title: string;
  description: string;
  showAction: boolean;
  actionText?: string;
}

function getAlertConfig(access: SubscriptionAccess): AlertConfig | null {
  const { status, isInTrial, daysLeftInTrial, daysUntilRenewal, showTrialEndingWarning, showRenewalWarning, showUrgentWarning } = access;

  // Trial states
  if (isInTrial && daysLeftInTrial !== null) {
    if (daysLeftInTrial <= 1) {
      return {
        style: 'red',
        icon: AlertCircle,
        title: 'Your free trial ends tomorrow',
        description: 'Subscribe now to keep messaging with your approved friends.',
        showAction: true,
        actionText: 'Subscribe to continue',
      };
    }
    if (showTrialEndingWarning) {
      return {
        style: 'yellow',
        icon: Clock,
        title: `Your free trial ends in ${daysLeftInTrial} days`,
        description: 'Subscribe before your trial ends to continue using Deebop Chat.',
        showAction: true,
        actionText: 'View plans',
      };
    }
    // Trial with more than 3 days left
    return {
      style: 'green',
      icon: CheckCircle,
      title: `You're on a free trial`,
      description: `${daysLeftInTrial} days remaining. Enjoy full access to all features.`,
      showAction: false,
    };
  }

  // Inactive - trial ended or never subscribed
  if (status === 'inactive') {
    return {
      style: 'red',
      icon: AlertCircle,
      title: 'Subscribe to continue',
      description: 'Your trial has ended. Subscribe to keep using Deebop Chat.',
      showAction: true,
      actionText: 'Subscribe now',
    };
  }

  // Past due - payment failed
  if (status === 'past_due') {
    return {
      style: 'red',
      icon: CreditCard,
      title: 'Payment failed',
      description: 'Please update your payment method to continue using Deebop Chat.',
      showAction: true,
      actionText: 'Update payment',
    };
  }

  // Cancelled - show when subscription will end
  if (status === 'cancelled' && daysUntilRenewal !== null) {
    return {
      style: 'yellow',
      icon: Clock,
      title: 'Subscription cancelled',
      description: `Your access continues until ${daysUntilRenewal === 0 ? 'today' : `${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}`}. You can resubscribe anytime.`,
      showAction: true,
      actionText: 'Resubscribe',
    };
  }

  // Active subscription renewal warnings
  if (status === 'active' && daysUntilRenewal !== null) {
    if (showUrgentWarning) {
      return {
        style: 'red',
        icon: CreditCard,
        title: 'Your subscription renews tomorrow',
        description: 'Your payment method will be charged for the next billing period.',
        showAction: false,
      };
    }
    if (showRenewalWarning) {
      return {
        style: 'yellow',
        icon: Clock,
        title: `Your subscription renews in ${daysUntilRenewal} days`,
        description: 'Manage your subscription from settings if needed.',
        showAction: false,
      };
    }
  }

  return null;
}
