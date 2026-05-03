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
