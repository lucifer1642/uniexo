-- 1. Create or Update Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'vendor', 'admin'
    university_id TEXT,
    business_name TEXT,
    service_type TEXT, -- 'car', 'pg', 'laundry'
    onsite_pickup INTEGER DEFAULT 0,
    store_delivery INTEGER DEFAULT 0,
    avatar_url TEXT,
    kyc_status TEXT DEFAULT 'none',
    is_deleted BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Laundry Services Table
CREATE TABLE IF NOT EXISTS public.laundry_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT,
    onsite_pickup BOOLEAN DEFAULT FALSE,
    on_store_service BOOLEAN DEFAULT FALSE,
    onsite_pickup_charge DECIMAL DEFAULT 0,
    provider_name TEXT,
    provider_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE NOT NULL, -- Format UNI-XXXX
    user_id UUID REFERENCES public.profiles(id),
    vendor_id UUID REFERENCES public.profiles(id),
    service_type TEXT NOT NULL,
    service_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL,
    payment_status TEXT DEFAULT 'unpaid',
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Function for Auto-generating Booking ID
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INT;
BEGIN
    INSERT INTO booking_sequence DEFAULT VALUES RETURNING id INTO seq_val;
    NEW.booking_id := 'UNI-' || LPAD(seq_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for Booking ID
-- Note: Requires a sequence table
CREATE TABLE IF NOT EXISTS public.booking_sequence (id SERIAL PRIMARY KEY);

DROP TRIGGER IF EXISTS trg_generate_booking_id ON public.bookings;
CREATE TRIGGER trg_generate_booking_id
BEFORE INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.booking_id IS NULL)
EXECUTE FUNCTION generate_booking_id();

-- 6. Disable RLS for simple DB-only store/fetch as requested
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles DISABLE ROW LEVEL SECURITY;

-- 7. Add any missing columns to profiles for multi-role flexibility
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='password_hash') THEN
        ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
    END IF;
END $$;
