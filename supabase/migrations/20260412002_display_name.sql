-- Migration: Tamer display name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;
