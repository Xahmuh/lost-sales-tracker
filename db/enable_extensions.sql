-- Enable pgcrypto extension for gen_random_bytes() function
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Validate that the extension is working
DO $$
BEGIN
    PERFORM gen_random_bytes(10);
END $$;
