-- ==========================================================
-- ANTIGRAVITY PATCH: BRANCH OPERATIONAL CONTROL
-- ==========================================================

-- 1. Add new columns to branches table
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_spin_enabled BOOLEAN DEFAULT TRUE;

-- 2. Set default values for existing records
UPDATE public.branches SET is_spin_enabled = TRUE WHERE is_spin_enabled IS NULL;

-- 3. Grant Permissions (just in case)
GRANT ALL ON TABLE public.branches TO anon, authenticated, service_role;

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
