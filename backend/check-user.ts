import { supabase } from './src/config/supabase';

async function checkUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'uniexo.in@gmail.com')
    .single();
  
  console.log('USER_CHECK:', JSON.stringify({ data, error }));
}

checkUser();
