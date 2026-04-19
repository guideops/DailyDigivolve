-- Crest stage system: per-digimon stage progression + tamer material stockpile
-- Login rewards: cumulative daily reward calendar

-- Tamer profile additions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crest_materials    JSONB    DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_day          INTEGER  DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_reward_date TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS armor_digi_count   INTEGER  DEFAULT 0;

-- Per-digimon crest stages (persistent through de-digivolution)
ALTER TABLE digimon  ADD COLUMN IF NOT EXISTS crest_stages       JSONB    DEFAULT '{}'::jsonb;
