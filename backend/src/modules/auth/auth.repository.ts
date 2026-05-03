import { supabase } from '../../config/supabase';
import { UserRole } from '../../types/enums';

export class AuthRepository {
  async findByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) return null;
    return data;
  }

  async findByEmailWithPassword(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) return null;
    return data;
  }

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
    universityId?: string;
    location?: string;
    businessName?: string;
    serviceType?: string;
  }): Promise<any> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: data.password,
        role: data.role || UserRole.USER,
        university_id: data.universityId,
        location: data.location,
        business_name: data.businessName,
        service_type: data.serviceType,
        is_verified: true
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async findById(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    await supabase
      .from('profiles')
      .update({ refresh_token: token })
      .eq('id', userId);
  }

  // OTP Logic
  async createOTP(data: { email: string, otp: string, purpose: string, userData?: any }): Promise<void> {
    const { error } = await supabase
      .from('otp_logs')
      .insert({
        email: data.email.toLowerCase(),
        otp: data.otp,
        purpose: data.purpose,
        user_data: data.userData,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins
      });
    
    if (error) throw error;
  }

  async findOTP(email: string, otp: string, purpose: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('purpose', purpose)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  }

  async deleteOTP(email: string, purpose: string): Promise<void> {
    await supabase
      .from('otp_logs')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose);
  }

  async updatePassword(email: string, passwordHash: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ password: passwordHash })
      .eq('email', email.toLowerCase());
  }

  async findByToken(token: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('refresh_token', token)
      .single();
    
    if (error) return null;
    return data;
  }
}
