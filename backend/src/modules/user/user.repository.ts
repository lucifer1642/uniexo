import { supabase } from '../../config/supabase';
import { UserRole } from '../../types/enums';

const PROFILE_SELECT_WITH_PASSWORD =
  'id, name, email, phone, password, role, avatar, university_id, location, id_card_photo_url, kyc_status, bank_details, is_verified, created_at, is_deleted, is_suspended';

const PROFILE_SELECT_PUBLIC =
  'id, name, email, phone, role, avatar, university_id, location, id_card_photo_url, kyc_status, bank_details, is_verified, created_at, is_deleted, is_suspended';

export interface ProfileDTO {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  universityId?: string;
  location?: string;
  idCardPhotoUrl?: string;
  kycStatus?: string;
  bankDetails?: unknown;
  isEmailVerified?: boolean;
  createdAt?: string;
  isDeleted?: boolean;
  isSuspended?: boolean;
}

function mapRow(row: Record<string, unknown>): ProfileDTO {
  return {
    _id: row.id as string,
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || undefined,
    password: (row.password as string) || undefined,
    role: row.role as UserRole,
    avatar: (row.avatar as string) || undefined,
    universityId: (row.university_id as string) || undefined,
    location: (row.location as string) || undefined,
    idCardPhotoUrl: (row.id_card_photo_url as string) || undefined,
    kycStatus: (row.kyc_status as string) || undefined,
    bankDetails: row.bank_details,
    isEmailVerified: row.is_verified === true,
    createdAt: row.created_at as string | undefined,
    isDeleted: row.is_deleted === true,
    isSuspended: row.is_suspended === true,
  };
}

export class UserRepository {
  async findById(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_PUBLIC)
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  }

  async findByIdWithPassword(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_WITH_PASSWORD)
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      phone: string;
      avatar: string;
      idCardPhotoUrl: string;
      universityId: string;
      location: string;
      businessName: string;
      serviceType: string;
    }>,
  ): Promise<ProfileDTO | null> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.avatar !== undefined) patch.avatar = data.avatar;
    if (data.idCardPhotoUrl !== undefined) patch.id_card_photo_url = data.idCardPhotoUrl;
    if (data.universityId !== undefined) patch.university_id = data.universityId;
    if (data.location !== undefined) patch.location = data.location;
    if (data.businessName !== undefined) patch.business_name = data.businessName;
    if (data.serviceType !== undefined) patch.service_type = data.serviceType;

    const { data: row, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select(PROFILE_SELECT_PUBLIC)
      .single();
    if (error || !row) return null;
    return mapRow(row as Record<string, unknown>);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await supabase.from('profiles').update({ password: hashedPassword }).eq('id', userId);
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  }

  async softDelete(userId: string): Promise<void> {
    await supabase.from('profiles').update({ is_deleted: true }).eq('id', userId);
  }

  async submitKycRequest(
    userId: string,
    bankDetails: Record<string, unknown>,
    documents: unknown[],
  ): Promise<any> {
    await supabase.from('kyc_requests').delete().eq('user_id', userId).eq('status', 'pending');

    const { data: req, error: insErr } = await supabase
      .from('kyc_requests')
      .insert({
        user_id: userId,
        bank_details: bankDetails,
        documents,
        status: 'pending',
        rejection_reason: null,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    await supabase
      .from('profiles')
      .update({
        kyc_status: 'pending',
        bank_details: bankDetails,
      })
      .eq('id', userId);

    return req;
  }
}
