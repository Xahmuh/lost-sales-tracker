-- ==========================================================
-- ANTIGRAVITY PATCH: SERVER-SIDE SESSION GENERATION
-- ==========================================================

-- 1. Create RPC for secure generation
CREATE OR REPLACE FUNCTION public.generate_spin_session(
    p_branch_id UUID,
    p_is_multi_use BOOLEAN
)
RETURNS TABLE (
    token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_token TEXT;
    v_duration INTERVAL;
    v_expires_at TIMESTAMPTZ;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- 1. Generate Token (Simple alphanumeric, or use existing logic if passed? Let's gen here)
    v_token := encode(gen_random_bytes(12), 'hex');
    
    -- 2. Calculate Duration (Server Time)
    IF p_is_multi_use THEN
        v_duration := '7 days'::INTERVAL;
    ELSE
        v_duration := '15 minutes'::INTERVAL; -- Increased to 15m to be safe
    END IF;
    
    v_expires_at := NOW() + v_duration;
    
    -- 3. Insert
    INSERT INTO public.spin_sessions (token, branch_id, is_multi_use, expires_at)
    VALUES (v_token, p_branch_id, p_is_multi_use, v_expires_at)
    RETURNING created_at INTO v_created_at;

    -- 4. Return
    RETURN QUERY SELECT v_token, v_expires_at, v_created_at;
END;
$$;

-- 2. Permissions
GRANT EXECUTE ON FUNCTION public.generate_spin_session(UUID, BOOLEAN) TO anon, authenticated, service_role;

-- 3. Ensure INSERT permission on table for Service Role (RPC bypasses this but good to have)
GRANT ALL ON public.spin_sessions TO service_role;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
