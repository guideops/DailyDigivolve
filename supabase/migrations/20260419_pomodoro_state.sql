-- Migration: Pomodoro state persistence for cross-device sync
-- Stores the active timer so PWA and webapp share the same session
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pomodoro_state JSONB DEFAULT NULL;
