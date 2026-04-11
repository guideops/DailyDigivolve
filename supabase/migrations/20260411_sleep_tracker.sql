-- Migration: Sleep tracker / REST system
-- Add sleep_state (current sleep session) and sleep_log (history) to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_state JSONB DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_log   JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digitama_credits INTEGER DEFAULT 0;
