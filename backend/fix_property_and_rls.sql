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
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

-- 4. Enable Supabase Realtime for houses and bookings
-- This allows frontend to listen for changes (pseudo-realtime is already there via polling, but this enables true realtime)
-- First, ensure the publication exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to the publication (using DO block to handle "already member" errors)
DO $$ 
BEGIN
  -- Add each table individually and ignore if already member
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE houses;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table houses already in publication or does not exist';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table bookings already in publication or does not exist';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE laundry_services;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table laundry_services already in publication or does not exist';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table orders already in publication or does not exist';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table payments already in publication or does not exist';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN others THEN RAISE NOTICE 'Table notifications already in publication or does not exist';
  END;
END $$;

-- 5. Add snapshot columns to bookings to "sync all attributes" as requested
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS service_snapshot JSONB,
ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_months INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS installments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Ensure houses table has necessary operational columns
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
