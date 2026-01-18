-- Migration: Add presence columns to children table
-- Run this in your Supabase SQL Editor

ALTER TABLE chat.children ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE chat.children ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Create index for faster presence queries
CREATE INDEX IF NOT EXISTS idx_children_is_online ON chat.children (is_online);
CREATE INDEX IF NOT EXISTS idx_children_last_seen_at ON chat.children (last_seen_at);
