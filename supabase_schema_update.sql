-- 1. Create Counter Table for UNI-XXXX IDs
CREATE TABLE IF NOT EXISTS uni_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO uni_id_counter (id, current_value) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- 2. Update Profiles Table
-- Add new columns safely
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='uni_id') THEN
    ALTER TABLE profiles ADD COLUMN uni_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='auth_provider') THEN
    ALTER TABLE profiles ADD COLUMN auth_provider TEXT DEFAULT 'email';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='google_id') THEN
    ALTER TABLE profiles ADD COLUMN google_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 3. Seed Admin User (uniexo.in@gmail.com / 12345678)
-- bcrypt hash for '12345678' (10 rounds)
-- Note: Replace the hash below if you want a different password.
DO $$ 
DECLARE
  admin_id UUID := gen_random_uuid();
  admin_uni_id TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'uniexo.in@gmail.com') THEN
    -- Increment counter for Admin
    UPDATE uni_id_counter SET current_value = current_value + 1 WHERE id = 1 RETURNING 'UNI-' || LPAD(current_value::TEXT, 4, '0') INTO admin_uni_id;
    
    INSERT INTO profiles (id, uni_id, email, password_hash, role, name, auth_provider, kyc_status, updated_at)
    VALUES (
      admin_id,
      admin_uni_id,
      'uniexo.in@gmail.com',
      '$2a$10$wN1Gg5oFj8mOQG.Q4oX6L.GZ/Q8G5.XyV.B9.bE/uK.yZkXG7PjK2', -- Hash for 12345678
      'admin',
      'Super Admin',
      'email',
      'approved',
      now()
    );
  END IF;
END $$;

-- 4. OTP Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- 6. Add email_verified to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email_verified') THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 7. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'bike')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  fuel_type TEXT DEFAULT 'Petrol',
  seating_capacity INTEGER DEFAULT 2,
  price_per_hour DECIMAL,
  price_per_day DECIMAL NOT NULL,
  description TEXT,
  location TEXT,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  current_status TEXT DEFAULT 'available' CHECK (current_status IN ('available', 'dispatched', 'maintenance')),
  current_booking_id UUID,
  expected_return_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'approved',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='current_booking_id') THEN
    ALTER TABLE vehicles ADD COLUMN current_booking_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='expected_return_at') THEN
    ALTER TABLE vehicles ADD COLUMN expected_return_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='approval_status') THEN
    ALTER TABLE vehicles ADD COLUMN approval_status TEXT DEFAULT 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='is_deleted') THEN
    ALTER TABLE vehicles ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_vehicles_vendor ON vehicles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type, is_available, is_deleted);

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  service_type TEXT NOT NULL DEFAULT 'vehicle',
  service_id UUID NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  booking_type TEXT DEFAULT 'daily',
  total_amount DECIMAL NOT NULL,
  security_deposit DECIMAL DEFAULT 0,
  monthly_rent DECIMAL DEFAULT 0,
  total_months INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  payment_method TEXT DEFAULT 'online',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON bookings(vendor_id, status);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  service_type TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='booking_id') THEN
    ALTER TABLE payments ADD COLUMN booking_id UUID REFERENCES bookings(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='service_type') THEN
    ALTER TABLE payments ADD COLUMN service_type TEXT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- 10. Vehicle Operations Table (Ledger)
CREATE TABLE IF NOT EXISTS vehicle_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('dispatch', 'return', 'maintenance_start', 'maintenance_end')),
  odometer INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_operations' AND column_name='booking_id') THEN
    ALTER TABLE vehicle_operations ADD COLUMN booking_id UUID REFERENCES bookings(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_vehicle_ops_vehicle ON vehicle_operations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_ops_vendor ON vehicle_operations(vendor_id);

-- 11. Houses Table (PG & Room Renting)
CREATE TABLE IF NOT EXISTS houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('pg', 'room')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area DECIMAL,
  room_size TEXT,
  bed_type TEXT,
  price_per_month DECIMAL,
  price_per_day DECIMAL,
  single_sharing_price DECIMAL,
  double_sharing_price DECIMAL,
  triple_sharing_price DECIMAL,
  security_deposit DECIMAL,
  lockin_period TEXT,
  notice_period TEXT,
  electricity_included BOOLEAN DEFAULT true,
  electricity_charge DECIMAL,
  location_url TEXT,
  tenants_staying INTEGER DEFAULT 0,
  faqs JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'approved',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_houses_vendor ON houses(vendor_id);

-- 12. Laundry Services Table
CREATE TABLE IF NOT EXISTS laundry_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  provider_name TEXT,
  provider_phone TEXT,
  provider_address TEXT,
  services JSONB DEFAULT '[]', -- Array of {name, price, unit}
  images TEXT[] DEFAULT '{}',
  rank INTEGER DEFAULT 0,
  onsite_pickup BOOLEAN DEFAULT false,
  on_store_service BOOLEAN DEFAULT true,
  onsite_pickup_charge DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_laundry_vendor ON laundry_services(vendor_id);

-- 13. Laundry Orders Table
CREATE TABLE IF NOT EXISTS laundry_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  laundry_service_id UUID NOT NULL REFERENCES laundry_services(id),
  items JSONB DEFAULT '[]', -- Array of {serviceName, quantity}
  delivery_address TEXT NOT NULL,
  pickup_type TEXT DEFAULT 'store' CHECK (pickup_type IN ('onsite', 'store')),
  pickup_date TIMESTAMPTZ,
  total_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'picked_up', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_laundry_orders_user ON laundry_orders(user_id);

-- 14. Intelligence & Telemetry Module
CREATE TABLE IF NOT EXISTS user_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  campus TEXT,
  current_page TEXT,
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  location_lat DECIMAL,
  location_lng DECIMAL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_telemetry_heartbeat ON user_telemetry(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_telemetry_campus ON user_telemetry(campus);

CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL, -- user_id or vendor_id
  type TEXT NOT NULL CHECK (type IN ('user', 'vendor')),
  ltv_score DECIMAL DEFAULT 0,
  churn_risk_score DECIMAL DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  quality_decay_score DECIMAL DEFAULT 0,
  predictions JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intel_entity ON intelligence_metrics(entity_id, type);

CREATE TABLE IF NOT EXISTS platform_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  gtv DECIMAL DEFAULT 0,
  conversion_funnel JSONB DEFAULT '{"search": 0, "view": 0, "book": 0, "pay": 0}',
  avg_latency_ms INTEGER DEFAULT 0,
  burn_rate DECIMAL DEFAULT 0,
  north_star_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kpi_date ON platform_kpis(snapshot_date);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_gtv DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  net_payout DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'settled')),
  carbon_footprint_kg DECIMAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settlement_vendor ON settlements(vendor_id, status);

-- 15. Marketplace Module
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL NOT NULL,
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  images TEXT[] DEFAULT '{}',
  location TEXT,
  is_sold BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_seller ON marketplace_items(seller_id);

CREATE TABLE IF NOT EXISTS marketplace_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES marketplace_items(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  offered_price DECIMAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_offers_item ON marketplace_offers(item_id);
CREATE INDEX IF NOT EXISTS idx_market_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_market_offers_seller ON marketplace_offers(seller_id);

-- 16. Enable Realtime for All Tables
BEGIN;
  -- Remove the default supabase_realtime publication
  DROP PUBLICATION IF EXISTS supabase_realtime;
  -- Re-create the supabase_realtime publication with no tables
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add all application tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE uni_id_counter;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE otp_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE houses;
ALTER PUBLICATION supabase_realtime ADD TABLE laundry_services;
ALTER PUBLICATION supabase_realtime ADD TABLE laundry_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE user_telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_kpis;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_items;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_offers;
