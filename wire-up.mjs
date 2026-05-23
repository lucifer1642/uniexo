// Wire-up script: Check DB, seed user, test login
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ydzdnmxbcuiptwfzhyml.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkemRubXhiY3VpcHR3ZnpoeW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc4Njc1MiwiZXhwIjoyMDkzMzYyNzUyfQ.nX9eh6oWht19QNRL7GVAkiGUity_7TmK3D37qAyAG74';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkAndFix() {
  console.log('=== STEP 1: CHECK DATABASE STATE ===\n');

  // Check profiles table
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (profilesErr) {
    console.error('❌ profiles table ERROR:', profilesErr.message);
    console.error('\n⚠️  You MUST run supabase_schema_update.sql in Supabase SQL Editor first!');
    console.error('   Go to: https://supabase.com/dashboard/project/ydzdnmxbcuiptwfzhyml/sql/new');
    process.exit(1);
  }

  console.log(`✅ profiles table exists (${profiles.length} rows)`);

  // Check if profiles has the required columns
  if (profiles.length > 0) {
    const cols = Object.keys(profiles[0]);
    console.log('   Columns:', cols.join(', '));
    const required = ['id', 'email', 'password_hash', 'role', 'name', 'is_deleted', 'is_suspended', 'phone', 'uni_id'];
    const missing = required.filter(c => !cols.includes(c));
    if (missing.length > 0) {
      console.error(`❌ profiles table MISSING columns: ${missing.join(', ')}`);
      console.error('\n⚠️  Run supabase_schema_update.sql in Supabase SQL Editor to fix!');
      process.exit(1);
    }
    console.log('   ✅ All required columns present');
  }

  // Check vendor_profiles table
  const { error: vpErr } = await supabase.from('vendor_profiles').select('id').limit(1);
  if (vpErr) {
    console.error('❌ vendor_profiles table ERROR:', vpErr.message);
    console.error('\n⚠️  Run supabase_schema_update.sql in Supabase SQL Editor to fix!');
    process.exit(1);
  }
  console.log('✅ vendor_profiles table exists');

  // Check uni_id_counter
  const { data: counter, error: counterErr } = await supabase.from('uni_id_counter').select('*');
  if (counterErr) {
    console.error('❌ uni_id_counter table ERROR:', counterErr.message);
    process.exit(1);
  }
  console.log('✅ uni_id_counter:', counter);

  // Check other tables
  for (const table of ['otp_codes', 'notifications', 'vehicles', 'bookings', 'houses', 'laundry_services', 'payments']) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }

  // === STEP 2: Ensure admin user exists with valid bcrypt password ===
  console.log('\n=== STEP 2: CHECK/CREATE ADMIN USER ===\n');

  const bcrypt = await import('bcryptjs');
  const TEST_PASSWORD = '12345678';

  const { data: adminUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'uniexo.in@gmail.com')
    .maybeSingle();

  if (adminUser) {
    console.log('Admin user found:', adminUser.email, '| role:', adminUser.role);
    
    // Verify the stored hash actually works
    if (adminUser.password_hash) {
      try {
        const match = bcrypt.compareSync(TEST_PASSWORD, adminUser.password_hash);
        console.log(`Password "${TEST_PASSWORD}" matches stored hash: ${match}`);
        
        if (!match) {
          console.log('Fixing admin password hash...');
          const newHash = bcrypt.hashSync(TEST_PASSWORD, 10);
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ password_hash: newHash })
            .eq('email', 'uniexo.in@gmail.com');
          
          if (updateErr) {
            console.error('Failed to update hash:', updateErr);
          } else {
            // Verify the fix
            const verify = bcrypt.compareSync(TEST_PASSWORD, newHash);
            console.log(`✅ Password hash updated. Verify: ${verify}`);
          }
        }
      } catch (e) {
        console.error('Bcrypt error with stored hash:', e.message);
        console.log('Regenerating password hash...');
        const newHash = bcrypt.hashSync(TEST_PASSWORD, 10);
        await supabase
          .from('profiles')
          .update({ password_hash: newHash })
          .eq('email', 'uniexo.in@gmail.com');
        console.log('✅ Password hash regenerated');
      }
    } else {
      console.log('No password_hash set! Setting one...');
      const newHash = bcrypt.hashSync(TEST_PASSWORD, 10);
      await supabase
        .from('profiles')
        .update({ password_hash: newHash })
        .eq('email', 'uniexo.in@gmail.com');
      console.log('✅ Password hash set');
    }
  } else {
    console.log('Admin user NOT found. Creating...');
    const crypto = await import('crypto');
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(TEST_PASSWORD, 10);
    
    // Get next uni_id
    const { data: ctr } = await supabase.from('uni_id_counter').select('current_value').eq('id', 1).single();
    const nextVal = (ctr?.current_value || 0) + 1;
    await supabase.from('uni_id_counter').update({ current_value: nextVal }).eq('id', 1);
    
    const { error: insertErr } = await supabase.from('profiles').insert({
      id,
      uni_id: `UNI-${String(nextVal).padStart(4, '0')}`,
      email: 'uniexo.in@gmail.com',
      password_hash: hash,
      role: 'admin',
      name: 'Super Admin',
      auth_provider: 'email',
      kyc_status: 'approved',
      email_verified: true,
    });
    
    if (insertErr) {
      console.error('Failed to create admin:', insertErr);
    } else {
      console.log(`✅ Admin user created: uniexo.in@gmail.com / ${TEST_PASSWORD}`);
    }
  }

  // Also create a test regular user
  console.log('\n=== STEP 3: CHECK/CREATE TEST USER ===\n');
  
  const { data: testUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'test@uniexo.in')
    .maybeSingle();

  if (testUser) {
    console.log('Test user exists:', testUser.email);
    // Make sure password works
    if (testUser.password_hash) {
      const match = bcrypt.compareSync('test1234', testUser.password_hash);
      if (!match) {
        const newHash = bcrypt.hashSync('test1234', 10);
        await supabase.from('profiles').update({ password_hash: newHash }).eq('email', 'test@uniexo.in');
        console.log('✅ Test user password fixed');
      } else {
        console.log('✅ Test user password OK');
      }
    }
  } else {
    console.log('Creating test user...');
    const crypto = await import('crypto');
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync('test1234', 10);

    const { data: ctr } = await supabase.from('uni_id_counter').select('current_value').eq('id', 1).single();
    const nextVal = (ctr?.current_value || 0) + 1;
    await supabase.from('uni_id_counter').update({ current_value: nextVal }).eq('id', 1);

    const { error: insertErr } = await supabase.from('profiles').insert({
      id,
      uni_id: `UNI-${String(nextVal).padStart(4, '0')}`,
      email: 'test@uniexo.in',
      password_hash: hash,
      role: 'user',
      name: 'Test User',
      auth_provider: 'email',
      kyc_status: 'none',
      email_verified: true,
    });
    
    if (insertErr) {
      console.error('Failed to create test user:', insertErr);
    } else {
      console.log('✅ Test user created: test@uniexo.in / test1234');
    }
  }

  // Final summary
  console.log('\n=== FINAL STATE ===\n');
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('email, role, uni_id, auth_provider, is_deleted, is_suspended')
    .order('created_at');
  
  if (allUsers) {
    allUsers.forEach(u => {
      console.log(`  ${u.email} | ${u.role} | ${u.uni_id} | deleted=${u.is_deleted} | suspended=${u.is_suspended}`);
    });
  }
  
  console.log('\n✅ Database is ready!');
  console.log('   Admin login: uniexo.in@gmail.com / 12345678');
  console.log('   Test login:  test@uniexo.in / test1234');
}

checkAndFix().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
