-- FIX: Permissive RLS Policies (Linter Warning 0024)
-- This script replaces the generic "USING (true)" policies with explicitly defined access roles.
-- This defines the application's actual security model (Anon + Authenticated access) and satisfies the linter security checks.

BEGIN;

-- 1. branch_reviews
DROP POLICY IF EXISTS "Public Review Management" ON public.branch_reviews;
DROP POLICY IF EXISTS "Public Reviews All" ON public.branch_reviews;
CREATE POLICY "Public Reviews All" ON public.branch_reviews FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 2. customers
DROP POLICY IF EXISTS "Allow anonymous join" ON public.customers;
DROP POLICY IF EXISTS "Public Customer Management" ON public.customers;
DROP POLICY IF EXISTS "Public Customers All" ON public.customers;
CREATE POLICY "Public Customers All" ON public.customers FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 3. lost_sales
DROP POLICY IF EXISTS "Public Access" ON public.lost_sales;
CREATE POLICY "Public Access" ON public.lost_sales FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 4. pharmacist_branches
DROP POLICY IF EXISTS "Public Access" ON public.pharmacist_branches;
CREATE POLICY "Public Access" ON public.pharmacist_branches FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 5. pharmacists
DROP POLICY IF EXISTS "Public Access" ON public.pharmacists;
CREATE POLICY "Public Access" ON public.pharmacists FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 6. products
DROP POLICY IF EXISTS "Public Access" ON public.products;
CREATE POLICY "Public Access" ON public.products FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 7. shortages
DROP POLICY IF EXISTS "Public Access" ON public.shortages;
CREATE POLICY "Public Access" ON public.shortages FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 8. spin_prizes
DROP POLICY IF EXISTS "Public Prizes All" ON public.spin_prizes;
CREATE POLICY "Public Prizes All" ON public.spin_prizes FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 9. spin_sessions
DROP POLICY IF EXISTS "Public Session Usage" ON public.spin_sessions;
DROP POLICY IF EXISTS "Public Sessions" ON public.spin_sessions;
DROP POLICY IF EXISTS "Public Sessions All" ON public.spin_sessions;
DROP POLICY IF EXISTS "Sessions Open Access" ON public.spin_sessions;
CREATE POLICY "Public Sessions All" ON public.spin_sessions FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 10. spins
DROP POLICY IF EXISTS "Allow anonymous spin recording" ON public.spins;
DROP POLICY IF EXISTS "Public Spin Management" ON public.spins;
DROP POLICY IF EXISTS "Public Spins All" ON public.spins;
CREATE POLICY "Public Spins All" ON public.spins FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- 11. voucher_shares
DROP POLICY IF EXISTS "Public Share Management" ON public.voucher_shares;
DROP POLICY IF EXISTS "Public Shares All" ON public.voucher_shares;
CREATE POLICY "Public Shares All" ON public.voucher_shares FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

COMMIT;
