
-- Final RLS and Schema Fix for Spin & Win
-- This ensures all tables have public access for the engagement flow

-- 1. Ensure columns exist (for robustness)
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS prize_id UUID REFERENCES public.spin_prizes(id);
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(100);

-- 2. Relax RLS for all tables to ensure data recording works
-- Customers
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Customers All" ON public.customers;
CREATE POLICY "Public Customers All" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Spin Prizes
ALTER TABLE public.spin_prizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_prizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Prizes All" ON public.spin_prizes;
CREATE POLICY "Public Prizes All" ON public.spin_prizes FOR ALL USING (true) WITH CHECK (true);

-- Spin Sessions
ALTER TABLE public.spin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Sessions All" ON public.spin_sessions;
CREATE POLICY "Public Sessions All" ON public.spin_sessions FOR ALL USING (true) WITH CHECK (true);

-- Spins
ALTER TABLE public.spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Spins All" ON public.spins;
CREATE POLICY "Public Spins All" ON public.spins FOR ALL USING (true) WITH CHECK (true);

-- Branch Reviews
ALTER TABLE public.branch_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Reviews All" ON public.branch_reviews;
CREATE POLICY "Public Reviews All" ON public.branch_reviews FOR ALL USING (true) WITH CHECK (true);

-- Voucher Shares
ALTER TABLE public.voucher_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Shares All" ON public.voucher_shares;
CREATE POLICY "Public Shares All" ON public.voucher_shares FOR ALL USING (true) WITH CHECK (true);
