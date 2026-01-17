-- Migration: Create referral system tables
-- Run this in Supabase SQL Editor

-- Referral codes (unique code per parent)
CREATE TABLE IF NOT EXISTS chat.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,
  code VARCHAR(12) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_referrer UNIQUE(referrer_parent_id)
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS chat.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,
  referee_parent_id UUID REFERENCES chat.parents(id) ON DELETE SET NULL,
  code_used VARCHAR(12) NOT NULL,
  status TEXT NOT NULL DEFAULT 'clicked'
    CHECK (status IN ('clicked', 'signed_up', 'subscribed', 'eligible', 'credited', 'invalid')),
  child_names TEXT[],
  click_fingerprint TEXT,
  signup_ip_hash TEXT,
  referee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ,
  first_payment_at TIMESTAMPTZ,
  eligible_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  notes TEXT,
  invalidated_by TEXT,
  invalidated_at TIMESTAMPTZ
);

-- Billing credits
CREATE TABLE IF NOT EXISTS chat.billing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('referral', 'promo', 'admin', 'refund')),
  quantity INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  referral_id UUID REFERENCES chat.referrals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON chat.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON chat.referrals(referrer_parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON chat.referrals(referee_parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON chat.referrals(status);
CREATE INDEX IF NOT EXISTS idx_billing_credits_parent ON chat.billing_credits(parent_id);
CREATE INDEX IF NOT EXISTS idx_billing_credits_unapplied ON chat.billing_credits(parent_id) WHERE applied_at IS NULL;
