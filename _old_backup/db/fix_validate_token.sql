-- ==========================================================
-- ANTIGRAVITY PATCH: FIX & SECURE VALIDATE_TOKEN FUNCTION
-- ==========================================================

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
    -- Explicitly select columns to avoid ambiguity or record mismatch
    SELECT 
        s.branch_id, 
        s.used, 
        s.expires_at, 
        s.is_multi_use,
        b.name as branch_name, 
        b.google_maps_link, 
        b.is_spin_enabled
    INTO v_session
    FROM public.spin_sessions s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE s.token = p_token;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'INVALID_TOKEN'::TEXT;
        RETURN;
    END IF;

    -- Check if branch is operability is suspended
    IF v_session.is_spin_enabled IS FALSE THEN
         RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'BRANCH_SUSPENDED'::TEXT;
         RETURN;
    END IF;

    -- Check if token is used (single use)
    IF v_session.used AND NOT v_session.is_multi_use THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_ALREADY_USED'::TEXT;
        RETURN;
    END IF;

    -- Check expiry
    IF v_session.expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_EXPIRED'::TEXT;
        RETURN;
    END IF;

    -- Return Success
    RETURN QUERY SELECT 
        v_session.branch_id, 
        v_session.branch_name, 
        v_session.google_maps_link, 
        v_session.is_multi_use, 
        TRUE, 
        NULL::TEXT;
END;
$$;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
