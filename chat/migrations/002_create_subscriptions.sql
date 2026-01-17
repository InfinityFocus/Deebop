-- Subscriptions table for paid subscription model
-- Run this against your Supabase database

-- Main subscriptions table
CREATE TABLE IF NOT EXISTS chat.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,

  -- Subscription status and plan
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'trial', 'active', 'past_due', 'cancelled', 'free')),
  plan TEXT CHECK (plan IN ('monthly', 'annual')),
  amount_pence INTEGER,

  -- Trial tracking (14-day free trial)
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Paid subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- UK Consumer Protection (14-day cooling-off period)
  cooling_off_eligible BOOLEAN DEFAULT true,
  cooling_off_expires_at TIMESTAMPTZ,

  -- Admin free account override
  is_free_account BOOLEAN DEFAULT false,
  free_account_granted_by TEXT,
  free_account_granted_at TIMESTAMPTZ,
  free_account_reason TEXT,

  -- Stripe fields (NULL during testing phase)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One subscription per parent
  CONSTRAINT unique_parent_subscription UNIQUE(parent_id)
);

-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON chat.subscriptions(status);

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_parent_id ON chat.subscriptions(parent_id);

-- Renewal notifications table
CREATE TABLE IF NOT EXISTS chat.renewal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES chat.subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('3_day', '1_day', 'trial_3_day', 'trial_1_day')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate notifications
  UNIQUE(subscription_id, notification_type, scheduled_for)
);

-- Index for pending notifications
CREATE INDEX IF NOT EXISTS idx_renewal_notifications_pending
  ON chat.renewal_notifications(scheduled_for)
  WHERE sent_at IS NULL;

-- Comment on tables
COMMENT ON TABLE chat.subscriptions IS 'Subscription management for paid accounts - £3.99/month or £39/year with 14-day free trial';
COMMENT ON TABLE chat.renewal_notifications IS 'Track sent renewal and trial ending notifications';
