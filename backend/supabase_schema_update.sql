-- Add custom auth columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Create OTP logs table
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    purpose TEXT NOT NULL,
    user_data JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_logs_email_otp_purpose ON otp_logs(email, otp, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires_at ON otp_logs(expires_at);
