
-- BRANCH CONTROL EXTENSION
-- Adds capability to enable/disable features per branch

-- 1. Add control column
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS is_spin_enabled BOOLEAN DEFAULT TRUE;

-- 2. Ensure all existing branches are enabled by default
UPDATE public.branches SET is_spin_enabled = TRUE WHERE is_spin_enabled IS NULL;

-- 3. Sync permissions
GRANT ALL ON TABLE public.branches TO anon, authenticated;
