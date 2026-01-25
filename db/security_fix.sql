-- Secure Function Search Paths
-- This script dynamically sets the search_path to 'public' for specific functions to resolve security warnings.
-- It avoids needing to know the exact function signatures by querying the system catalog.

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure::text as func_signature 
        FROM pg_proc 
        WHERE proname IN (
            'generate_spin_session', 
            'update_pharmacist_names', 
            'set_pharmacist_name', 
            'execute_spin_transaction', 
            'validate_spin_token', 
            'audit_shortage_status_change'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Securing function: %', func_record.func_signature;
        EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public';
    END LOOP;
END $$;

-- ADDRESSING RLS POLICY WARNINGS (Advisory)
-- The following tables have policies using "USING (true)" which allows public access.
-- While flagged as a warning, this may be intentional for the anonymous-access nature of the Spin & Win components.
--
-- Tables flagged:
-- 1. branch_reviews (Public Review Management)
-- 2. customers (Allow anonymous join)
-- 3. lost_sales (Public Access)
-- 4. pharmacist_branches (Public Access)
-- 5. pharmacists (Public Access)
-- 6. products (Public Access)
-- 7. shortages (Public Access)
-- 8. spin_prizes (Public Prizes All)
-- 9. spin_sessions (Public Session Usage)
-- 10. spins (Allow anonymous spin recording)
-- 11. voucher_shares (Public Share Management)
--
-- RECOMMENDATION:
-- To fix these warnings without breaking the app, we would need to implement Row Level Security that checks for
-- specific roles (e.g., 'anon', 'authenticated') or service keys.
-- For now, NO ACTION is taken on RLS to ensure functionality remains uninterrupted during testing.
