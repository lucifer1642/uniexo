import { AdminRepository } from './admin.repository';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { User, MarketplaceItem, VendorProfile, KycRequest } from '../../database/models';
import { UserRole } from '../../types/enums';
import { KycStatus } from '../../database/models/KycRequest';
import { NotificationService } from '../../services/notification.service';

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
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.role === 'admin') throw new BadRequestError('Cannot suspend admin');
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
    return this.adminRepo.upsertSetting(
      'commission_percent',
      percent,
      'Platform commission percentage',
    );
  }

  async getTransactions(page = 1, limit = 20) {
    return this.adminRepo.getTransactions(page, limit);
  }

  async removeReportedItem(itemId: string) {
    const item = await MarketplaceItem.findById(itemId);
    if (!item) throw new NotFoundError('Item not found');
    return this.adminRepo.removeReportedItem(itemId);
  }

  async backfillVendorProfiles(): Promise<{ created: number; skipped: number }> {
    const vendorUsers = await User.find({ role: UserRole.VENDOR, isDeleted: false });
    let created = 0;
    let skipped = 0;

    for (const user of vendorUsers) {
      const existing = await VendorProfile.findOne({ userId: user._id });
      if (!existing) {
        await VendorProfile.create({
          userId: user._id,
          businessName: user.name,
          businessAddress: 'Not provided',
          businessPhone: user.phone || 'Not provided',
          description: 'Vendor profile auto-created by admin backfill',
        });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped };
  }

  async listKycRequests() {
    return KycRequest.find({ isDeleted: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  async processKycRequest(kycId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const kycRequest = await KycRequest.findById(kycId);
    if (!kycRequest) throw new NotFoundError('KYC request not found');

    const status = action === 'approve' ? KycStatus.APPROVED : KycStatus.REJECTED;
    kycRequest.status = status;
    if (rejectionReason) kycRequest.rejectionReason = rejectionReason;
    await kycRequest.save();

    // Update user status
    const user = await User.findById(kycRequest.userId);
    if (user) {
      user.kycStatus = action === 'approve' ? 'approved' : 'rejected';
      await user.save();
      
      // Send notification
      await NotificationService.sendKycUpdate(user._id.toString(), user.kycStatus, rejectionReason);
    }

    return kycRequest;
  }
}
