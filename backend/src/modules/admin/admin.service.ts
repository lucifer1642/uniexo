import { AdminRepository } from './admin.repository';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { UserRole, KycStatus } from '../../types/enums';
import { NotificationService } from '../../services/notification.service';
import { supabase } from '../../config/supabase';

export class AdminService {
  private adminRepo: AdminRepository;

  constructor() {
    this.adminRepo = new AdminRepository();
  }

  async getDashboard() {
    return this.adminRepo.getDashboardStats();
  }

  async listUsers(page = 1, limit = 20, role?: string, search?: string) {
    return this.adminRepo.listUsers(page, limit, role, search);
  }

  async suspendUser(userId: string, suspended: boolean) {
    const { data } = await supabase.from('profiles').select('id, role').eq('id', userId).single();
    if (!data) throw new NotFoundError('User not found');
    if ((data as { role: string }).role === UserRole.ADMIN) throw new BadRequestError('Cannot suspend admin');
    return this.adminRepo.suspendUser(userId, suspended);
  }

  async getReportedItems(page = 1, limit = 10) {
    return this.adminRepo.getReportedItems(page, limit);
  }

  async getSettings() {
    return this.adminRepo.getSettings();
  }

  async updateSetting(key: string, value: unknown, description?: string) {
    return this.adminRepo.upsertSetting(key, value, description);
  }

  async setCommission(percent: number) {
    if (percent < 0 || percent > 100) {
      throw new BadRequestError('Commission must be between 0 and 100');
    }
    return this.adminRepo.upsertSetting('commission_percent', percent, 'Platform commission percentage');
  }

  async getTransactions(page = 1, limit = 20) {
    return this.adminRepo.getTransactions(page, limit);
  }

  async removeReportedItem(itemId: string) {
    const { data } = await supabase.from('marketplace_items').select('id').eq('id', itemId).single();
    if (!data) throw new NotFoundError('Item not found');
    return this.adminRepo.removeReportedItem(itemId);
  }

  async backfillVendorProfiles(): Promise<{ created: number; skipped: number }> {
    const { data: vendorUsers } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('role', UserRole.VENDOR)
      .eq('is_deleted', false);

    let created = 0;
    let skipped = 0;

    for (const user of vendorUsers ?? []) {
      const uid = user.id as string;
      const { data: existing } = await supabase.from('vendor_profiles').select('id').eq('user_id', uid).maybeSingle();
      if (existing) {
        skipped++;
      } else {
        await supabase.from('vendor_profiles').insert({
          user_id: uid,
          business_name: user.name ?? 'Vendor',
          business_address: 'Not provided',
          business_phone: user.phone ?? 'Not provided',
          description: 'Vendor profile auto-created by admin backfill',
          approval_status: 'pending',
        });
        created++;
      }
    }

    return { created, skipped };
  }

  async listKycRequests() {
    const { data, error } = await supabase
      .from('kyc_requests')
      .select('*, profiles:user_id(name, email)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => ({ ...r, _id: r.id }));
  }

  async processKycRequest(kycId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const { data: req, error: rErr } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('id', kycId)
      .single();

    if (rErr || !req) throw new NotFoundError('KYC request not found');

    const statusDb = action === 'approve' ? KycStatus.APPROVED : KycStatus.REJECTED;
    const profileKyc = action === 'approve' ? 'approved' : 'rejected';

    await supabase
      .from('kyc_requests')
      .update({
        status: statusDb,
        rejection_reason: rejectionReason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kycId);

    const userId = String((req as { user_id: string }).user_id);

    await supabase
      .from('profiles')
      .update({ kyc_status: profileKyc, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await NotificationService.sendKycUpdate(userId, profileKyc, rejectionReason);

    const { data: updated } = await supabase.from('kyc_requests').select('*').eq('id', kycId).single();
    return updated ? { ...updated, _id: updated.id } : null;
  }

  async getVendorsByCategory(category: string) {
    const validCategories = ['ROOM', 'CAR', 'LAUNDRY'];
    if (!validCategories.includes(category)) {
      throw new BadRequestError('Invalid category. Must be ROOM, CAR, or LAUNDRY');
    }
    return this.adminRepo.getVendorsByCategory(category as 'ROOM' | 'CAR' | 'LAUNDRY');
  }

  async updateVendorRank(vendorProfileId: string, rank: number) {
    if (rank < 0) {
      throw new BadRequestError('Rank must be a non-negative number');
    }
    const profile = await this.adminRepo.updateVendorRank(vendorProfileId, rank);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }
}
