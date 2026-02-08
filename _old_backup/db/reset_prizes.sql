-- Ensure column exists (Safe migration)
ALTER TABLE spin_prizes ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;

-- Clear existing prizes
TRUNCATE TABLE spin_prizes CASCADE;

-- Insert new prizes
INSERT INTO spin_prizes (name, type, value, probability_weight, daily_limit, is_active, color) VALUES
('5% Off – Next Visit', 'discount', 5, 20, 0, true, '#3B82F6'),
('7% Off Cosmetics', 'discount', 7, 15, 0, true, '#EC4899'),
('7% Off Medical Devices', 'discount', 7, 15, 0, true, '#06B6D4'),
('7% Off Supplements', 'discount', 7, 15, 0, true, '#10B981'),
('Free in Body (7 Days)', 'gift', 0, 20, 0, true, '#F59E0B'),
('3 BD Cashback (Min. 60 BD)', 'discount', 3, 15, 0, true, '#8B5CF6');
