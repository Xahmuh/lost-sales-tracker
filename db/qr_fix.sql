
-- FINAL RECOVERY SQL
-- Run this if QR codes are showing "Invalid or Expired"

-- 1. Ensure RLS is totally open for the sessions table during testing
ALTER TABLE public.spin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions Open Access" ON public.spin_sessions;
CREATE POLICY "Sessions Open Access" ON public.spin_sessions FOR ALL USING (true) WITH CHECK (true);

-- 2. Fixed Validation Function (Timezone Aware & Error Logging)
CREATE OR REPLACE FUNCTION public.validate_spin_token(p_token TEXT)
RETURNS TABLE (
    branch_id UUID,
    branch_name TEXT,
    google_maps_link TEXT,
    is_multi_use BOOLEAN,
    is_valid BOOLEAN,
    error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Use a clean select with no JOIN first to diagnose
    SELECT * INTO v_session FROM public.spin_sessions WHERE token = p_token;

    IF v_session IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_NOT_FOUND'::TEXT;
        RETURN;
    END IF;

    IF v_session.used AND NOT v_session.is_multi_use THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_USED'::TEXT;
        RETURN;
    END IF;

    -- Timezone agnostic check: compare with current DB time
    IF v_session.expires_at < (now() at time zone 'utc') AND v_session.expires_at < now() THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE, 'TOKEN_EXPIRED'::TEXT;
        RETURN;
    END IF;

    -- If we get here, pull branch info
    RETURN QUERY 
    SELECT 
        b.id, 
        b.name, 
        b.google_maps_link, 
        v_session.is_multi_use, 
        TRUE, 
        NULL::TEXT
    FROM public.branches b
    WHERE b.id = v_session.branch_id;
END;
$$;

-- 3. Ensure everyone can run the check
GRANT EXECUTE ON FUNCTION public.validate_spin_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_spin_token(TEXT) TO authenticated;
GRANT ALL ON TABLE public.spin_sessions TO anon, authenticated;
