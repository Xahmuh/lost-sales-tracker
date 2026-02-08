-- =====================================================
-- FIX: Enable UPDATE permission for branches table
-- This allows the Manager to suspend/activate branches
-- =====================================================

-- Step 1: Grant UPDATE permission to authenticated users on branches table
GRANT UPDATE ON TABLE public.branches TO authenticated, anon;

-- Step 2: Create/Replace RLS Policy to allow UPDATE on is_spin_enabled
DROP POLICY IF EXISTS "Allow branch updates" ON public.branches;

CREATE POLICY "Allow branch updates"
ON public.branches
FOR UPDATE
TO authenticated, anon
USING (true)  -- Allow reading any row
WITH CHECK (true);  -- Allow updating any row

-- Step 3: Ensure SELECT is also allowed (for fetching branches list)
DROP POLICY IF EXISTS "Allow reading branches" ON public.branches;

CREATE POLICY "Allow reading branches"
ON public.branches
FOR SELECT
TO authenticated, anon
USING (true);

-- Step 4: Verify RLS is enabled
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Step 5: Force schema reload
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION QUERY (Run this to check current state)
-- =====================================================
-- SELECT id, name, is_spin_enabled FROM public.branches LIMIT 5;
