-- ==========================================
-- Deebop Chat Database Schema
-- Separate schema for child-safe messaging app
-- ==========================================

-- Create the chat schema
CREATE SCHEMA IF NOT EXISTS chat;

-- ==========================================
-- Parents Table
-- ==========================================
CREATE TABLE chat.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for email lookups during login
CREATE INDEX idx_parents_email ON chat.parents(email);

-- ==========================================
-- Children Table
-- ==========================================
CREATE TABLE chat.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES chat.parents(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'cat',
  age_band TEXT NOT NULL CHECK (age_band IN ('6-8', '9-10', '11-12')),
  oversight_mode TEXT NOT NULL DEFAULT 'approve_first'
    CHECK (oversight_mode IN ('monitor', 'approve_first', 'approve_all')),
  messaging_paused BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for username lookups during login
CREATE INDEX idx_children_username ON chat.children(username);
-- Index for parent's children list
CREATE INDEX idx_children_parent_id ON chat.children(parent_id);

-- ==========================================
-- Friendships Table
-- ==========================================
CREATE TABLE chat.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES chat.children(id) ON DELETE CASCADE,
  friend_child_id UUID NOT NULL REFERENCES chat.children(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by_parent_id UUID REFERENCES chat.parents(id),
  UNIQUE(child_id, friend_child_id),
  -- Prevent self-friending
  CHECK (child_id != friend_child_id)
);

-- Index for finding a child's friendships
CREATE INDEX idx_friendships_child_id ON chat.friendships(child_id);
CREATE INDEX idx_friendships_friend_child_id ON chat.friendships(friend_child_id);
-- Index for pending friendships (for parent approval)
CREATE INDEX idx_friendships_pending ON chat.friendships(status) WHERE status = 'pending';

-- ==========================================
-- Conversations Table
-- ==========================================
CREATE TABLE chat.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_a_id UUID NOT NULL REFERENCES chat.children(id) ON DELETE CASCADE,
  child_b_id UUID NOT NULL REFERENCES chat.children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure consistent ordering (smaller ID first)
  UNIQUE(child_a_id, child_b_id),
  CHECK (child_a_id < child_b_id)
);

-- Index for finding a child's conversations
CREATE INDEX idx_conversations_child_a ON chat.conversations(child_a_id);
CREATE INDEX idx_conversations_child_b ON chat.conversations(child_b_id);

-- ==========================================
-- Messages Table
-- ==========================================
CREATE TABLE chat.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
  sender_child_id UUID NOT NULL REFERENCES chat.children(id),
  type TEXT NOT NULL CHECK (type IN ('text', 'emoji', 'voice')),
  content TEXT,
  media_key TEXT,
  media_duration_seconds FLOAT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'delivered', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ
);

-- Index for fetching conversation messages
CREATE INDEX idx_messages_conversation_id ON chat.messages(conversation_id, created_at DESC);
-- Index for pending messages (for parent approval)
CREATE INDEX idx_messages_pending ON chat.messages(sender_child_id, status) WHERE status = 'pending';
-- Index for recent messages per conversation
CREATE INDEX idx_messages_recent ON chat.messages(conversation_id, created_at DESC);

-- ==========================================
-- Approvals Table (audit log for message approvals)
-- ==========================================
CREATE TABLE chat.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat.messages(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES chat.parents(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for approval history
CREATE INDEX idx_approvals_message_id ON chat.approvals(message_id);
CREATE INDEX idx_approvals_parent_id ON chat.approvals(parent_id, created_at DESC);

-- ==========================================
-- Audit Log Table
-- ==========================================
CREATE TABLE chat.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES chat.parents(id),
  child_id UUID REFERENCES chat.children(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for parent's audit log
CREATE INDEX idx_audit_log_parent_id ON chat.audit_log(parent_id, created_at DESC);
-- Index for child-specific actions
CREATE INDEX idx_audit_log_child_id ON chat.audit_log(child_id, created_at DESC) WHERE child_id IS NOT NULL;

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to get or create a conversation between two children
CREATE OR REPLACE FUNCTION chat.get_or_create_conversation(
  p_child_a UUID,
  p_child_b UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_child_a UUID;
  v_child_b UUID;
BEGIN
  -- Ensure consistent ordering
  IF p_child_a < p_child_b THEN
    v_child_a := p_child_a;
    v_child_b := p_child_b;
  ELSE
    v_child_a := p_child_b;
    v_child_b := p_child_a;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM chat.conversations
  WHERE child_a_id = v_child_a AND child_b_id = v_child_b;

  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat.conversations (child_a_id, child_b_id)
    VALUES (v_child_a, v_child_b)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if two children are approved friends
CREATE OR REPLACE FUNCTION chat.are_friends(
  p_child_a UUID,
  p_child_b UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat.friendships
    WHERE (
      (child_id = p_child_a AND friend_child_id = p_child_b)
      OR
      (child_id = p_child_b AND friend_child_id = p_child_a)
    )
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a child is within quiet hours
CREATE OR REPLACE FUNCTION chat.is_quiet_hours(
  p_child_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_start TIME;
  v_end TIME;
  v_now TIME;
BEGIN
  SELECT quiet_hours_start, quiet_hours_end
  INTO v_start, v_end
  FROM chat.children
  WHERE id = p_child_id;

  -- No quiet hours set
  IF v_start IS NULL OR v_end IS NULL THEN
    RETURN FALSE;
  END IF;

  v_now := CURRENT_TIME;

  -- Handle overnight quiet hours (e.g., 21:00 - 07:00)
  IF v_start > v_end THEN
    RETURN v_now >= v_start OR v_now <= v_end;
  ELSE
    RETURN v_now >= v_start AND v_now <= v_end;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Comments for documentation
-- ==========================================
COMMENT ON SCHEMA chat IS 'Deebop Chat - Child-safe messaging application';
COMMENT ON TABLE chat.parents IS 'Parent accounts that own and manage child accounts';
COMMENT ON TABLE chat.children IS 'Child accounts created by parents';
COMMENT ON TABLE chat.friendships IS 'Friend connections between children (require parent approval)';
COMMENT ON TABLE chat.conversations IS '1:1 conversations between approved friends';
COMMENT ON TABLE chat.messages IS 'Messages within conversations';
COMMENT ON TABLE chat.approvals IS 'Audit log of parent approval/denial decisions';
COMMENT ON TABLE chat.audit_log IS 'General audit log for parent actions';
