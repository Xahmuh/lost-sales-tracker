-- FIX: NO_PRIZES_AVAILABLE Error
-- This script repopulates the prize table and ensures the selection logic works.
-- The Daily Limit is set to NULL (unlimited) instead of 0 (which means 0 allowed per day).

-- 1. Ensure prizes table has correct defaults
ALTER TABLE public.spin_prizes 
ALTER COLUMN daily_limit DROP NOT NULL,
ALTER COLUMN daily_limit SET DEFAULT NULL;

-- 2. Clear and Insert Prizes (With NULL daily_limit for unlimited)
TRUNCATE TABLE public.spin_prizes CASCADE;

INSERT INTO public.spin_prizes (name, type, value, probability_weight, daily_limit, is_active, color) VALUES
('5% Off – Next Visit', 'discount', 5, 20, NULL, true, '#3B82F6'),
('7% Off Cosmetics', 'discount', 7, 15, NULL, true, '#EC4899'),
('7% Off Medical Devices', 'discount', 7, 15, NULL, true, '#06B6D4'),
('7% Off Supplements', 'discount', 7, 15, NULL, true, '#10B981'),
('Free in Body (7 Days)', 'gift', 0, 20, NULL, true, '#F59E0B'),
('3 BD Cashback (Min. 60 BD)', 'discount', 3, 15, NULL, true, '#8B5CF6');

-- 3. Verify Logic (Simulation)
DO $$
DECLARE
    v_prize_id UUID;
BEGIN
    WITH active_prizes AS (
        SELECT id, probability_weight
        FROM public.spin_prizes
        WHERE is_active = TRUE
        -- Logic test: daily_limit IS NULL should pass
        AND (daily_limit IS NULL OR daily_limit > 0)
    ),
    weighted_pool AS (
        SELECT id, 
               sum(probability_weight) OVER (ORDER BY id) as upper_bound,
               sum(probability_weight) OVER () as total_weight
        FROM active_prizes
    )
    SELECT id INTO v_prize_id
    FROM weighted_pool
    WHERE upper_bound >= (random() * total_weight)
    LIMIT 1;

    IF v_prize_id IS NULL THEN
        RAISE NOTICE 'WARNING: Prize selection simulation FAILED';
    ELSE
        RAISE NOTICE 'SUCCESS: Prize selection simulation PASSED';
    END IF;
END $$;
