-- 1. DROP the foreign key constraint that links profiles to Supabase Auth
-- This is necessary because we are now using a custom identity system
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Add custom auth columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- 4. ENSURE profiles.id has a default value
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Create OTP logs table
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    purpose TEXT NOT NULL,
    user_data JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_logs_email_otp_purpose ON otp_logs(email, otp, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON otp_logs(expires_at);

-- Profiles: KYC (used by Supabase-backed user/admin flows)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS bank_details JSONB;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- KYC request queue for admin review
CREATE TABLE IF NOT EXISTS kyc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests(status);

-- Razorpay payment records
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    service_type TEXT NOT NULL,
    reference_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    receipt TEXT NOT NULL,
    notes JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference_id ON payments(reference_id);

-- Laundry (required before `orders`; your project may have created these separately)
CREATE TABLE IF NOT EXISTS laundry_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL DEFAULT '',
    description TEXT,
    provider_name TEXT,
    provider_phone TEXT,
    provider_address TEXT,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    rank INTEGER DEFAULT 0,
    onsite_pickup BOOLEAN DEFAULT TRUE,
    on_store_service BOOLEAN DEFAULT TRUE,
    onsite_pickup_charge NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laundry_services_vendor ON laundry_services(vendor_id);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    laundry_service_id UUID NOT NULL REFERENCES laundry_services(id),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    commission_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    pickup_address TEXT,
    pickup_phone TEXT,
    notes TEXT,
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_laundry_service ON orders(laundry_service_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- Admin-editable settings (e.g. commission %)
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Wallets / ledger (if missing, ALTER-only lines below would fail)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
    balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    reference_id UUID,
    service_type TEXT,
    balance_after NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Reviews (service ratings)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    service_type TEXT NOT NULL,
    service_id UUID NOT NULL,
    rating NUMERIC NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);

-- Fleet / dispatch fields on vehicles (optional)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_return_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_booking_id UUID,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS odometer_out NUMERIC,
ADD COLUMN IF NOT EXISTS odometer_in NUMERIC,
ADD COLUMN IF NOT EXISTS dispatch_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicles_vendor ON vehicles(vendor_id);
