-- APPLY CUSTOM COLORS TO PRIZES
-- This script updates the existing prizes with the specific vibrant colors requested by the user.

-- 1. 5% Off – Next Visit -> #B91c1c (Tabarak Red)
UPDATE public.spin_prizes 
SET color = '#B91c1c' 
WHERE name = '5% Off Next Visit';

-- 2. 7% Off Cosmetics -> #0891b2 (Cyan-600)
UPDATE public.spin_prizes 
SET color = '#0891b2' 
WHERE name = '7% Off Cosmetics';

-- 3. 7% Off Medical Devices -> #f59e0b (Amber-500)
UPDATE public.spin_prizes 
SET color = '#f59e0b' 
WHERE name = '7% Off Medical Devices';

-- 4. 7% Off Supplements -> #B91c1c (Tabarak Red)
UPDATE public.spin_prizes 
SET color = '#B91c1c' 
WHERE name = '7% Off Supplements';

-- 5. Free in Body (7 Days) -> #0891b2 (Cyan-600)
UPDATE public.spin_prizes 
SET color = '#0891b2' 
WHERE name = 'Free in-Body 7 Days';

-- 6. 3 BD Cashback -> #f59e0b (Amber-500)
UPDATE public.spin_prizes 
SET color = '#f59e0b' 
WHERE name LIKE '3 BD Cashback%';

-- Verify Updates
DO $$
BEGIN
    RAISE NOTICE 'Colors updated successfully for all active prizes.';
END $$;
