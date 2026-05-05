-- 1. Disable RLS for all known tables in public schema
-- This script targets the public schema to avoid touching 'auth'
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. Add missing columns to houses table
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS room_size TEXT,
ADD COLUMN IF NOT EXISTS bed_type TEXT,
ADD COLUMN IF NOT EXISTS tenants_staying INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS common_amenities TEXT[],
ADD COLUMN IF NOT EXISTS room_amenities TEXT[],
ADD COLUMN IF NOT EXISTS services_amenities TEXT[],
ADD COLUMN IF NOT EXISTS food_amenities TEXT[],
ADD COLUMN IF NOT EXISTS price_per_hour NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lockin_period TEXT,
ADD COLUMN IF NOT EXISTS notice_period TEXT,
ADD COLUMN IF NOT EXISTS electricity_included BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS electricity_charge NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_url TEXT;

-- 3. Ensure other potential missing columns are present (syncing with IHouse)
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS price_per_month NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS single_sharing_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS double_sharing_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS triple_sharing_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0;
