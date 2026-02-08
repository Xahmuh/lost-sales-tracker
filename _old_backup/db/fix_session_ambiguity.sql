-- ==========================================================
-- ANTIGRAVITY PATCH: FIX AMBIGUOUS COLUMNS IN RPC
-- ==========================================================

-- We rename the output columns to avoid conflicts with table column names in the INSERT statement
CREATE OR REPLACE FUNCTION public.generate_spin_session(
    p_branch_id UUID,
    p_is_multi_use BOOLEAN
)
RETURNS TABLE (
    out_token TEXT,
    out_expires_at TIMESTAMPTZ,
    out_created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_token TEXT;
    v_duration INTERVAL;
    v_expires_at TIMESTAMPTZ;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- 1. Generate Token
    v_token := encode(gen_random_bytes(12), 'hex');
    
    -- 2. Calculate Duration
    IF p_is_multi_use THEN
        v_duration := '7 days'::INTERVAL;
    ELSE
        v_duration := '15 minutes'::INTERVAL;
    END IF;
    
    v_expires_at := NOW() + v_duration;
    
    -- 3. Insert (Safe from ambiguity now that output variables have 'out_' prefix)
    INSERT INTO public.spin_sessions (token, branch_id, is_multi_use, expires_at)
    VALUES (v_token, p_branch_id, p_is_multi_use, v_expires_at)
    RETURNING created_at INTO v_created_at;

    -- 4. Return using strict assignment
    RETURN QUERY SELECT v_token, v_expires_at, v_created_at;
END;
$$;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
