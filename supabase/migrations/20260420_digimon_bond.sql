-- Migration: Per-digimon bond — bond is now unique to each tamer-digimon pair
-- Farm digimon do not gain bond; new hatches start at 0
ALTER TABLE digimon ADD COLUMN IF NOT EXISTS bond NUMERIC DEFAULT 0;
