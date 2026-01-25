
-- Production-Grade Spin & Win Logic (Server-Side)
-- Moves all sensitive logic to Postgres for security and atomicity.

-- 1. Function to validate a session token and get branch details
CREATE OR REPLACE FUNCTION public.validate_spin_token(p_token TEXT)
RETURNS TABLE (
    branch_id UUID,
    branch_name TEXT,
    google_maps_link TEXT,
    is_multi_use BOOLEAN,
    is_valid BOOLEAN,
    error_message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT s.*, b.name as b_name, b.google_maps_link as b_link 
    INTO v_session
    FROM public.spin_sessions s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE s.token = p_token;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'INVALID_TOKEN'::TEXT;
        RETURN;
    END IF;

    IF v_session.used AND NOT v_session.is_multi_use THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_ALREADY_USED'::TEXT;
        RETURN;
    END IF;

    IF v_session.expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_EXPIRED'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT 
        v_session.branch_id, 
        v_session.b_name, 
        v_session.b_link, 
        v_session.is_multi_use, 
        TRUE, 
        NULL::TEXT;
END;
$$;

-- 2. Atomic Spin Transaction
CREATE OR REPLACE FUNCTION public.execute_spin_transaction(
    p_token TEXT,
    p_phone TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
    spin_id UUID,
    voucher_code TEXT,
    prize_id UUID,
    prize_name TEXT,
    prize_type TEXT,
    prize_value DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_branch_id UUID;
    v_customer_id UUID;
    v_prize_id UUID;
    v_prize_record RECORD;
    v_voucher_code TEXT;
    v_session_used BOOLEAN;
    v_multi_use BOOLEAN;
BEGIN
    -- 1. Validate Session with locking
    SELECT branch_id, used, is_multi_use INTO v_branch_id, v_session_used, v_multi_use
    FROM public.spin_sessions
    WHERE token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_TOKEN'; END IF;
    IF v_session_used AND NOT v_multi_use THEN RAISE EXCEPTION 'TOKEN_ALREADY_USED'; END IF;

    -- 2. Upsert Customer
    INSERT INTO public.customers (phone, first_name, last_name, email)
    VALUES (p_phone, p_first_name, p_last_name, p_email)
    ON CONFLICT (phone) DO UPDATE 
    SET first_name = COALESCE(EXCLUDED.first_name, public.customers.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.customers.last_name),
        email = COALESCE(EXCLUDED.email, public.customers.email)
    RETURNING id INTO v_customer_id;

    -- 3. Select Prize (Weighted Random + Daily Limit Check)
    -- This logic handles probabilities and inventory in one step
    WITH active_prizes AS (
        SELECT id, name, type, value, probability_weight
        FROM public.spin_prizes
        WHERE is_active = TRUE
        AND (
            daily_limit IS NULL 
            OR daily_limit > (
                SELECT count(*) FROM public.spins 
                WHERE prize_id = public.spin_prizes.id 
                AND created_at >= CURRENT_DATE
            )
        )
    ),
    weighted_pool AS (
        SELECT id, name, type, value,
               sum(probability_weight) OVER (ORDER BY id) as upper_bound,
               sum(probability_weight) OVER () as total_weight
        FROM active_prizes
    )
    SELECT id INTO v_prize_id
    FROM weighted_pool
    WHERE upper_bound >= (random() * total_weight)
    LIMIT 1;

    IF v_prize_id IS NULL THEN
        RAISE EXCEPTION 'NO_PRIZES_AVAILABLE';
    END IF;

    -- Fetch prize details for return
    SELECT * INTO v_prize_record FROM public.spin_prizes WHERE id = v_prize_id;

    -- 4. Generate Unique Voucher Code
    v_voucher_code := 'VOUCH-' || upper(substring(md5(random()::text), 1, 8));

    -- 5. Record Spin
    INSERT INTO public.spins (customer_id, branch_id, prize_id, voucher_code)
    VALUES (v_customer_id, v_branch_id, v_prize_id, v_voucher_code)
    RETURNING id INTO spin_id;

    -- 6. Mark Session Used
    IF NOT v_multi_use THEN
        UPDATE public.spin_sessions SET used = TRUE WHERE token = p_token;
    END IF;

    -- 7. Return Results
    RETURN QUERY SELECT 
        spin_id, 
        v_voucher_code, 
        v_prize_id, 
        v_prize_record.name, 
        v_prize_record.type::TEXT, 
        v_prize_record.value;
END;
$$;

-- 3. Secure RLS Fix for Production
-- Disable direct table writes for normal users, force use of RPC
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System Only" ON public.customers;
CREATE POLICY "System Only" ON public.customers FOR ALL USING (auth.role() = 'service_role');
-- Support anonymous SELECT for dashboard (optional, depends on auth)
CREATE POLICY "Anon Read Only" ON public.customers FOR SELECT USING (true);

ALTER TABLE public.spins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System Only" ON public.spins;
CREATE POLICY "System Only" ON public.spins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Anon Read Only" ON public.spins FOR SELECT USING (true);

-- Ensure anon can execute functions
GRANT EXECUTE ON FUNCTION public.validate_spin_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_spin_transaction(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
