-- ==========================================================
-- ANTIGRAVITY PATCH: COMPREHENSIVE TOKEN REPAIR
-- ==========================================================

-- 1. Ensure Table Schema and Defaults are Correct
CREATE TABLE IF NOT EXISTS public.spin_sessions (
    token TEXT PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    is_multi_use BOOLEAN DEFAULT FALSE
);

-- Ensure defaults are applied for any weird existing rows or future inserts
ALTER TABLE public.spin_sessions ALTER COLUMN used SET DEFAULT FALSE;
ALTER TABLE public.spin_sessions ALTER COLUMN is_multi_use SET DEFAULT FALSE;
ALTER TABLE public.spin_sessions ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. DROP Old Validation Function to change signature safely
DROP FUNCTION IF EXISTS public.validate_spin_token(TEXT);

-- 3. RECREATE Validation Function with NON-AMBIGUOUS output names
CREATE OR REPLACE FUNCTION public.validate_spin_token(p_token TEXT)
RETURNS TABLE (
    out_branch_id UUID,
    out_branch_name TEXT,
    out_google_maps_link TEXT,
    out_is_multi_use BOOLEAN,
    out_is_valid BOOLEAN,
    out_error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_session RECORD;
BEGIN
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

    -- CASE 1: Token Not Found
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'INVALID_TOKEN'::TEXT;
        RETURN;
    END IF;

    -- CASE 2: Branch Suspended
    IF v_session.is_spin_enabled IS FALSE THEN
         RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'BRANCH_SUSPENDED'::TEXT;
         RETURN;
    END IF;

    -- CASE 3: Token Used (and not multi-use)
    IF v_session.used AND NOT v_session.is_multi_use THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_ALREADY_USED'::TEXT;
        RETURN;
    END IF;

    -- CASE 4: Token Expired
    IF v_session.expires_at < NOW() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_EXPIRED'::TEXT;
        RETURN;
    END IF;

    -- CASE 5: Valid
    RETURN QUERY SELECT 
        v_session.branch_id, 
        v_session.branch_name, 
        v_session.google_maps_link, 
        v_session.is_multi_use, 
        TRUE, 
        NULL::TEXT;
END;
$$;

-- 4. Permissions
GRANT EXECUTE ON FUNCTION public.validate_spin_token(TEXT) TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.spin_sessions TO anon, authenticated, service_role;
GRANT INSERT ON TABLE public.spin_sessions TO authenticated, service_role;

-- RELOAD RELOAD
NOTIFY pgrst, 'reload schema';
