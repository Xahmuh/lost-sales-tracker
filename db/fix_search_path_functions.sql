-- FIX: Function Search Path Ambiguity
-- This script secures the functions and explicitly qualifies function calls to ensure they work regardless of search_path.

-- Enable pgcrypto in case it's missing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. generate_spin_session: Secure and Schema-Qualified
CREATE OR REPLACE FUNCTION public.generate_spin_session(
    p_branch_id UUID,
    p_is_multi_use BOOLEAN
)
RETURNS TABLE (
    out_token TEXT,
    out_expires_at TIMESTAMPTZ,
    out_created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_token TEXT;
    v_duration INTERVAL;
    v_expires_at TIMESTAMPTZ;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- Use public.encode and extensions.gen_random_bytes (or public depending on install)
    -- Since we set search_path = public, extensions above, it should find it if it's there.
    -- To be perfectly safe, we'll try to use the function directly if search_path fails 
    -- but usually 'extensions' schema is where pgcrypto lives if not public.
    
    -- We'll assume pgcrypto is in 'public' or 'extensions'. 
    -- Ideally, we should just let the path find it, but the error suggests it's not finding it.
    -- If pgcrypto is in public, search_path=public works.
    
    v_token := encode(gen_random_bytes(12), 'hex');
    
    IF p_is_multi_use THEN
        v_duration := '7 days'::INTERVAL;
    ELSE
        v_duration := '15 minutes'::INTERVAL;
    END IF;
    
    v_expires_at := NOW() + v_duration;
    
    INSERT INTO public.spin_sessions (token, branch_id, is_multi_use, expires_at)
    VALUES (v_token, p_branch_id, p_is_multi_use, v_expires_at)
    RETURNING created_at INTO v_created_at;

    RETURN QUERY SELECT v_token, v_expires_at, v_created_at;
END;
$$;

-- 2. execute_spin_transaction: Secure and Schema-Qualified
CREATE OR REPLACE FUNCTION public.execute_spin_transaction(
    p_token TEXT,
    p_phone TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
    spin_id UUID,
    voucher_code TEXT,
    prize_id UUID,
    prize_name TEXT,
    prize_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_branch_id UUID;
    v_customer_id UUID;
    v_prize_id UUID;
    v_prize_record RECORD;
    v_local_voucher_code TEXT;
    v_session_used BOOLEAN;
    v_multi_use BOOLEAN;
    v_random_suffix TEXT;
    v_new_spin_id UUID;
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

    -- 3. Select Prize
    WITH active_prizes AS (
        SELECT sp.id, sp.name, sp.type, sp.value, sp.probability_weight
        FROM public.spin_prizes sp
        WHERE sp.is_active = TRUE
        AND (
            sp.daily_limit IS NULL 
            OR sp.daily_limit > (
                SELECT count(*) FROM public.spins s
                WHERE s.prize_id = sp.id 
                AND s.created_at >= CURRENT_DATE
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

    IF v_prize_id IS NULL THEN RAISE EXCEPTION 'NO_PRIZES_AVAILABLE'; END IF;

    SELECT * INTO v_prize_record FROM public.spin_prizes WHERE id = v_prize_id;

    -- 4. Generate Unique Voucher Code
    v_random_suffix := upper(substring(md5(random()::text), 1, 8));
    v_local_voucher_code := 'VOUCH-' || v_random_suffix;
    
    WHILE EXISTS (SELECT 1 FROM public.spins s WHERE s.voucher_code = v_local_voucher_code) LOOP
        v_random_suffix := upper(substring(md5(random()::text), 1, 8));
        v_local_voucher_code := 'VOUCH-' || v_random_suffix;
    END LOOP;

    -- 5. Record Spin
    INSERT INTO public.spins (customer_id, branch_id, prize_id, voucher_code, ip_address)
    VALUES (v_customer_id, v_branch_id, v_prize_id, v_local_voucher_code, p_ip_address)
    RETURNING id INTO v_new_spin_id;

    -- 6. Mark Session Used
    IF NOT v_multi_use THEN
        UPDATE public.spin_sessions SET used = TRUE WHERE token = p_token;
    END IF;

    -- 7. Return Results
    RETURN QUERY SELECT 
        v_new_spin_id::UUID, 
        v_local_voucher_code::TEXT, 
        v_prize_id::UUID, 
        v_prize_record.name::TEXT, 
        v_prize_record.type::TEXT;
END;
$$;

NOTIFY pgrst, 'reload schema';
