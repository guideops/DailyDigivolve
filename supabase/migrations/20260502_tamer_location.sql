-- Migration: Add tamer location field for local timezone identification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;
