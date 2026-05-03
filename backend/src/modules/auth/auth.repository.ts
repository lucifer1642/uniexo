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

  async createUser(data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: UserRole;
    universityId?: string;
    location?: string;
  }): Promise<any> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: data.id,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        role: data.role || UserRole.USER,
        university_id: data.universityId,
        location: data.location,
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

  async verifyEmail(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ kyc_status: 'approved' })
      .eq('id', userId);
  }
}
