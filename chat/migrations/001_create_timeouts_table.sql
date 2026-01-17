-- Timeouts table for Wrap-up Timer feature
-- Run this against your Supabase database

CREATE TABLE IF NOT EXISTS chat.timeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES chat.children(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat.conversations(id) ON DELETE CASCADE, -- NULL = all chats
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'active' | 'ended' | 'cancelled'
  reason TEXT, -- 'dinner' | 'bedtime' | 'school' | 'break' | NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_by TEXT -- 'parent' | 'system' | NULL
);

-- Index for finding active timeouts for a child
CREATE INDEX IF NOT EXISTS idx_timeouts_child_active
  ON chat.timeouts(child_id, status)
  WHERE status IN ('scheduled', 'active');

-- Index for finding timeouts by parent
CREATE INDEX IF NOT EXISTS idx_timeouts_parent
  ON chat.timeouts(parent_id, created_at DESC);

-- Add constraints
ALTER TABLE chat.timeouts
  ADD CONSTRAINT timeouts_status_check
  CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled'));

ALTER TABLE chat.timeouts
  ADD CONSTRAINT timeouts_reason_check
  CHECK (reason IS NULL OR reason IN ('dinner', 'bedtime', 'school', 'break'));

ALTER TABLE chat.timeouts
  ADD CONSTRAINT timeouts_ended_by_check
  CHECK (ended_by IS NULL OR ended_by IN ('parent', 'system'));

-- Comment on table
COMMENT ON TABLE chat.timeouts IS 'Wrap-up Timer (timeout) feature - allows parents to pause a child''s chat for a set duration';
