import bcrypt from 'bcryptjs';
import { supabase } from './src/config/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function seedAdmin() {
  const email = 'uniexo.in@gmail.com';
  const password = 'Uniexo@26';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Seeding Super Admin...');
  
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User exists, updating password and role...');
    const { error } = await supabase
      .from('profiles')
      .update({
        password: hashedPassword,
        role: 'admin',
        is_verified: true
      })
      .eq('email', email);
    
    if (error) console.error('Error updating admin:', error);
    else console.log('✅ Admin updated successfully');
  } else {
    console.log('User does not exist, creating...');
    const { error } = await supabase
      .from('profiles')
      .insert({
        name: 'Super Admin',
        email: email,
        phone: '0000000000',
        password: hashedPassword,
        role: 'admin',
        is_verified: true
      });
    
    if (error) console.error('Error creating admin:', error);
    else console.log('✅ Admin created successfully');
  }
}

seedAdmin();
