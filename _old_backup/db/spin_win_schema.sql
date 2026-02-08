-- Add Google Maps Link to branches
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Seed some dummy review links if they don't exist
UPDATE public.branches SET google_maps_link = 'https://search.google.com/local/writereview?placeid=ChIJ1Xik6F-nST4RbuvQ_cz8M4Y
' WHERE google_maps_link IS NULL;

-- 1. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Spin Prizes
CREATE TABLE IF NOT EXISTS public.spin_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('discount', 'free_item', 'gift')),
    value DECIMAL(10, 2) NOT NULL,
    probability_weight INTEGER NOT NULL DEFAULT 1,
    daily_limit INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Spin Sessions (for QR tokens)
CREATE TABLE IF NOT EXISTS public.spin_sessions (
    token VARCHAR(255) PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id),
    used BOOLEAN DEFAULT FALSE,
    is_multi_use BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Spins (History and Voucher recording)
CREATE TABLE IF NOT EXISTS public.spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    branch_id UUID REFERENCES public.branches(id),
    prize_id UUID REFERENCES public.spin_prizes(id),
    voucher_code VARCHAR(100) UNIQUE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Branch Reviews logs
CREATE TABLE IF NOT EXISTS public.branch_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    branch_id UUID REFERENCES public.branches(id),
    review_clicked BOOLEAN DEFAULT TRUE,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Voucher Shares (WhatsApp etc)
CREATE TABLE IF NOT EXISTS public.voucher_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code VARCHAR(100) NOT NULL,
    from_customer_id UUID REFERENCES public.customers(id),
    branch_id UUID REFERENCES public.branches(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_shares ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies (assuming basic auth roles)
DROP POLICY IF EXISTS "Public Read Prizes" ON public.spin_prizes;
CREATE POLICY "Public Read Prizes" ON public.spin_prizes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public Session Usage" ON public.spin_sessions;
CREATE POLICY "Public Session Usage" ON public.spin_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Customer Management" ON public.customers;
CREATE POLICY "Public Customer Management" ON public.customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Spin Management" ON public.spins;
CREATE POLICY "Public Spin Management" ON public.spins FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Review Management" ON public.branch_reviews;
CREATE POLICY "Public Review Management" ON public.branch_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Share Management" ON public.voucher_shares;
CREATE POLICY "Public Share Management" ON public.voucher_shares FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_spins_voucher ON public.spins(voucher_code);
CREATE INDEX IF NOT EXISTS idx_spins_customer ON public.spins(customer_id);
