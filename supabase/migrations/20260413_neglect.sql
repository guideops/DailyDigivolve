-- Migration: Neglect system
-- Tracks partner absence state, reconnection arc progress, and Sukamon risk
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neglect_state JSONB DEFAULT NULL;
