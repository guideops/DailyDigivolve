-- Migration: Campaign / Raid system
-- raid_state tracks the tamer's participation in the active community boss event
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raid_state JSONB DEFAULT NULL;
