-- Migration: Crest system, stamina, bond, and task template support
-- Run this in the Supabase SQL editor or via supabase db push

-- New profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bond              INTEGER       DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stamina           INTEGER       DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_stamina_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crest_history     JSONB         DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_stamina_today INTEGER      DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bond_actions_today JSONB        DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_day_reset    DATE          DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_streak      INTEGER       DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date   DATE          DEFAULT CURRENT_DATE;

-- tasks: rename category → template semantically
-- We keep the column named "category" in the DB for backward compat but populate with template values going forward
-- No schema change needed — the app will write template names into the category column

-- digimon: keep abi column (legacy) but it is no longer used for evolution gating
-- No change needed — abi column stays, app ignores it for evo requirements
