import { supabase } from './src/config/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function checkSupabase() {
  console.log('Checking Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profileError) {
      console.error('❌ Error accessing profiles table:', profileError);
    } else {
      console.log('✅ Profiles table exists. Count:', profiles);
    }

    const { data: otpLogs, error: otpError } = await supabase
      .from('otp_logs')
      .select('count', { count: 'exact', head: true });
    
    if (otpError) {
      console.error('❌ Error accessing otp_logs table:', otpError);
    } else {
      console.log('✅ otp_logs table exists. Count:', otpLogs);
    }

    // Check for default value of id in profiles
    const { data: idDef, error: idDefError } = await supabase
      .rpc('get_column_default', { t_name: 'profiles', c_name: 'id' });
    
    if (idDefError) {
      console.log('Could not check ID default via RPC, trying manual insert test...');
      const { error: insError } = await supabase.from('profiles').insert({ name: 'Test', email: 'test@test.com', phone: '1' }).select();
      if (insError && insError.message.includes('null value in column "id"')) {
        console.error('❌ id column in profiles MISSING default value!');
      } else {
        console.log('✅ id column seems to have a default or failed for other reasons');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSupabase();
