
-- BRANCH RECOVERY & SYNC
-- Ensures all valid branch IDs exist in the DB so sessions can be generated.

INSERT INTO public.branches (id, code, name, role) VALUES
('06ba725c-93ad-47a3-9a13-216479d502d1', 'ADMIN01', 'Tabarak Central HQ', 'admin'),
('1b3b2924-ef34-4626-a77f-33227f2915ad', 'T001', 'Tabarak Pharmacy - Jerdab branch', 'branch'),
('1b75e849-fb83-4f7c-89ec-344068a0c17c', 'S001', 'Sanad 1 Pharmacy - Club', 'branch'),
('2b062ff8-aa8a-4d75-8cc1-e609c65ab161', 'H003', 'Alhoda Pharmacy - Isa Town', 'branch'),
('2cb10ffc-fa88-49c9-9b72-a13089c51879', 'T005', 'Tabarak Pharmacy - West Riffa', 'branch'),
('35448ef7-1b91-4d48-8ad6-73fcfe020767', 'T003', 'Tabarak Pharmacy - Hidd Station', 'branch'),
('52325c35-d273-4b6f-bed1-aef28d55cc37', 'H004', 'Alhoda Pharmacy - Sanad branch', 'branch'),
('54c9c2cd-c11f-45e9-ae8b-17af071a9706', 'T004', 'Tabarak Pharmacy - Janabiya branch', 'branch'),
('575225e6-4dcb-4fd0-806b-e09fc6508477', 'T008', 'Tabarak Pharmacy - Hidd Club', 'branch'),
('61d320bb-5f30-47ff-bdcc-fa737e837088', 'S003', 'Janabiya Square Pharmacy', 'branch'),
('67a3254b-ea60-4aed-951f-7138da422597', 'D002', 'Damistan Pharmacy', 'branch'),
('806e481f-8264-4863-aa5c-6eddd36f7d71', 'T002', 'Tabarak Pharmacy - Qalali Station', 'branch'),
('8d428bcb-9594-43a9-a2f9-d684c0f7fd25', 'S002', 'Jamila Pharmacy - Zinj branch', 'branch'),
('9efda513-5566-4ad2-8342-b11732ba3eac', 'S004', 'Sanad 2 Pharmacy - Station', 'branch'),
('a26d4e01-3647-4eb3-ba3a-3b5e3c740037', 'H005', 'Alhoda Pharmacy - Budaiya branch', 'branch'),
('ac3367db-2d37-4fbd-90f8-466a331dbe43', 'T101', 'Tabarak Pharmacy - Qalali 2', 'branch'),
('b9b91ba2-09f8-4d0e-b271-c5ca37472629', 'H002', 'Alnahar Pharmacy - Jerdab branch', 'branch'),
('b9ddaed5-b104-4112-8dd9-dad1e1b9b7f3', 'H001', 'Alhoda Pharmacy - Tubli branch', 'branch'),
('d108dae1-93ba-4768-af9a-b69d512ad077', 'D001', 'District Pharmacy', 'branch'),
('eb8156ab-79e8-40da-8300-1fb08de96a46', 'T006', 'Tabarak Pharmacy - Juffair branch', 'branch'),
('eea51a55-f441-4ca4-a70f-2851faf0820a', 'T007', 'Tabarak Pharmacy - Karana Branch', 'branch'),
('f42e155a-685b-4789-bed7-c9d419160149', 'T009', 'Tabarak Pharmacy - Mashtan', 'branch')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code;

-- FINAL PERMISSION RESET
GRANT ALL ON TABLE public.spin_sessions TO anon, authenticated;
ALTER TABLE public.spin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Session Full Access" ON public.spin_sessions;
CREATE POLICY "Public Session Full Access" ON public.spin_sessions FOR ALL USING (true) WITH CHECK (true);
