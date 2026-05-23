-- ============================================================
-- UNIEXO – COMPLETE DATABASE SCHEMA  (single source of truth)
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- It drops ALL existing app tables and recreates them cleanly.
-- ============================================================

-- ── DROP EXISTING TABLES (reverse dependency order) ──────────
DROP TABLE IF EXISTS marketplace_offers CASCADE;
DROP TABLE IF EXISTS marketplace_items CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS platform_kpis CASCADE;
DROP TABLE IF EXISTS intelligence_metrics CASCADE;
DROP TABLE IF EXISTS user_telemetry CASCADE;
DROP TABLE IF EXISTS laundry_orders CASCADE;
DROP TABLE IF EXISTS laundry_services CASCADE;
DROP TABLE IF EXISTS vehicle_operations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS houses CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS uni_id_counter CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 1. UNI-ID COUNTER
-- ══════════════════════════════════════════════════════════════
CREATE TABLE uni_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO uni_id_counter (id, current_value) VALUES (1, 0);

-- ══════════════════════════════════════════════════════════════
-- 2. PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uni_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin')),
  auth_provider TEXT NOT NULL DEFAULT 'email',
  google_id TEXT,
  avatar_url TEXT,
  university_id TEXT,
  location TEXT,
  kyc_status TEXT DEFAULT 'none',
  business_name TEXT,
  service_type TEXT,
  onsite_pickup BOOLEAN,
  on_store_service BOOLEAN,
  store_delivery BOOLEAN,
  email_verified BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 3. VENDOR PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'Vendor',
  service_type TEXT NOT NULL DEFAULT 'ROOM',
  approval_status TEXT DEFAULT 'approved',
  business_phone TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 4. OTP CODES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 5. NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ══════════════════════════════════════════════════════════════
-- 6. VEHICLES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_vehicles_vendor ON vehicles(vendor_id);
CREATE INDEX idx_vehicles_type ON vehicles(type, is_available, is_deleted);

-- ══════════════════════════════════════════════════════════════
-- 7. BOOKINGS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_bookings_user ON bookings(user_id, status);
CREATE INDEX idx_bookings_vendor ON bookings(vendor_id, status);

-- ══════════════════════════════════════════════════════════════
-- 8. PAYMENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ══════════════════════════════════════════════════════════════
-- 9. VEHICLE OPERATIONS (ledger)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE vehicle_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('dispatch', 'return', 'maintenance_start', 'maintenance_end')),
  odometer INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_vehicle_ops_vehicle ON vehicle_operations(vehicle_id);
CREATE INDEX idx_vehicle_ops_vendor ON vehicle_operations(vendor_id);

-- ══════════════════════════════════════════════════════════════
-- 10. HOUSES (PG & Room Renting)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_houses_vendor ON houses(vendor_id);

-- ══════════════════════════════════════════════════════════════
-- 11. LAUNDRY SERVICES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE laundry_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider_name TEXT,
  provider_phone TEXT,
  provider_address TEXT,
  services JSONB DEFAULT '[]',
  images TEXT[] DEFAULT '{}',
  rank INTEGER DEFAULT 0,
  onsite_pickup BOOLEAN DEFAULT false,
  on_store_service BOOLEAN DEFAULT true,
  onsite_pickup_charge DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_laundry_vendor ON laundry_services(vendor_id);

-- ══════════════════════════════════════════════════════════════
-- 12. LAUNDRY ORDERS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE laundry_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  laundry_service_id UUID NOT NULL REFERENCES laundry_services(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
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
CREATE INDEX idx_laundry_orders_user ON laundry_orders(user_id);

-- ══════════════════════════════════════════════════════════════
-- 13. INTELLIGENCE & TELEMETRY
-- ══════════════════════════════════════════════════════════════
CREATE TABLE user_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  campus TEXT,
  current_page TEXT,
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  location_lat DECIMAL,
  location_lng DECIMAL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_telemetry_heartbeat ON user_telemetry(last_heartbeat);
CREATE INDEX idx_telemetry_campus ON user_telemetry(campus);

CREATE TABLE intelligence_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'vendor')),
  ltv_score DECIMAL DEFAULT 0,
  churn_risk_score DECIMAL DEFAULT 0,
  engagement_score DECIMAL DEFAULT 0,
  quality_decay_score DECIMAL DEFAULT 0,
  predictions JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_intel_entity ON intelligence_metrics(entity_id, type);

CREATE TABLE platform_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  gtv DECIMAL DEFAULT 0,
  conversion_funnel JSONB DEFAULT '{"search": 0, "view": 0, "book": 0, "pay": 0}',
  avg_latency_ms INTEGER DEFAULT 0,
  burn_rate DECIMAL DEFAULT 0,
  north_star_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kpi_date ON platform_kpis(snapshot_date);

CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_settlement_vendor ON settlements(vendor_id, status);

-- ══════════════════════════════════════════════════════════════
-- 14. MARKETPLACE
-- ══════════════════════════════════════════════════════════════
CREATE TABLE marketplace_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX idx_market_seller ON marketplace_items(seller_id);

CREATE TABLE marketplace_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_price DECIMAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_market_offers_item ON marketplace_offers(item_id);
CREATE INDEX idx_market_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX idx_market_offers_seller ON marketplace_offers(seller_id);

-- ══════════════════════════════════════════════════════════════
-- 15. SEED ADMIN USER (uniexo.in@gmail.com / 12345678)
-- ══════════════════════════════════════════════════════════════
-- bcrypt(10) hash of '12345678':
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  admin_uni_id TEXT;
BEGIN
  UPDATE uni_id_counter SET current_value = current_value + 1 WHERE id = 1
  RETURNING 'UNI-' || LPAD(current_value::TEXT, 4, '0') INTO admin_uni_id;

  INSERT INTO profiles (id, uni_id, email, password_hash, role, name, auth_provider, kyc_status, email_verified, updated_at)
  VALUES (
    admin_id,
    admin_uni_id,
    'uniexo.in@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin',
    'Super Admin',
    'email',
    'approved',
    true,
    now()
  );
END $$;

-- ══════════════════════════════════════════════════════════════
-- 16. REALTIME PUBLICATION
-- ══════════════════════════════════════════════════════════════
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE uni_id_counter;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_profiles;
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

-- ══════════════════════════════════════════════════════════════
-- 17. DISABLE RLS (service-role key bypasses anyway)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE uni_id_counter DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE houses DISABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_telemetry DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers DISABLE ROW LEVEL SECURITY;
