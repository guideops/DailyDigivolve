-- Login streak & Digitama system
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_streak      INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date   DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digitama_credits  INTEGER DEFAULT 0;
