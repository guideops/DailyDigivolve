-- Add due_date to tasks for weekly planner scheduling
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date date;

-- Add weekly_digimon to profiles (maps day abbrev → digimon uid)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_digimon jsonb DEFAULT '{}'::jsonb;
