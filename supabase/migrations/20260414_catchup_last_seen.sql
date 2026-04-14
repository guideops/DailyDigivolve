-- Migration: Persist the last catchup-modal date per user (device-agnostic)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS catchup_last_seen TEXT DEFAULT NULL;
