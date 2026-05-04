import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

async function cleanup() {
  console.log('🚀 Starting Database Cleanup...');

  try {
    // 1. Delete all non-admin profiles
    // This will trigger cascades if configured, but let's be explicit
    const { data: adminProfiles, error: adminErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminErr) throw adminErr;
    const adminIds = adminProfiles.map(p => p.id);
    console.log(`🛡️ Found ${adminIds.length} admin(s): ${adminIds.join(', ')}`);

    // Tables to clear entirely
    const tablesToClear = [
      'bookings',
      'payments',
      'wallet_transactions',
      'wallets',
      'kyc_requests',
      'otp_logs',
      'offers',
      'messages',
      'reviews'
    ];

    for (const table of tablesToClear) {
      console.log(`🧹 Clearing table: ${table}`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) console.warn(`⚠️ Warning clearing ${table}:`, error.message);
    }

    // Tables where we only keep admin content (if any, though admin usually doesn't have these)
    const listingTables = [
      'vehicles',
      'houses',
      'laundry_services',
      'marketplace_items'
    ];

    for (const table of listingTables) {
      console.log(`🧹 Clearing listings in: ${table}`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.warn(`⚠️ Warning clearing ${table}:`, error.message);
    }

    // Finally, delete all users except admins
    console.log('👤 Deleting non-admin users...');
    const { error: profileErr } = await supabase
      .from('profiles')
      .delete()
      .neq('role', 'admin');

    if (profileErr) throw profileErr;

    console.log('✅ Database Cleanup Complete. Only Admin remains.');
  } catch (error) {
    console.error('❌ Cleanup Failed:', error);
    process.exit(1);
  }
}

cleanup();
