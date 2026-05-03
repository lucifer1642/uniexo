import { supabase } from './src/config/supabase';

async function getLatestOTP() {
  const { data, error } = await supabase
    .from('otp_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error getting OTP:', error);
    return;
  }
  console.log('OTP_DATA:', JSON.stringify(data));
}

getLatestOTP();
