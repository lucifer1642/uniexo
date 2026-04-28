import bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { KycRequest, KycStatus } from '../../database/models/KycRequest';
import { User } from '../../database/models/User';

const SALT_ROUNDS = 12;

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      universityId: user.universityId,
      location: user.location,
      idCardPhotoUrl: user.idCardPhotoUrl,
      kycStatus: user.kycStatus,
      bankDetails: user.bankDetails,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; universityId?: string; location?: string }) {
    const user = await this.userRepo.updateProfile(userId, data);
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      universityId: user.universityId,
      location: user.location,
      idCardPhotoUrl: user.idCardPhotoUrl,
      kycStatus: user.kycStatus,
      bankDetails: user.bankDetails,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const imageUrl = await CloudinaryService.uploadImage(file.buffer, 'avatars');
    const user = await this.userRepo.updateProfile(userId, { avatar: imageUrl });
    if (!user) throw new NotFoundError('User not found');
    return { avatar: imageUrl };
  }

  async uploadIdCard(userId: string, file: Express.Multer.File) {
    const imageUrl = await CloudinaryService.uploadImage(file.buffer, 'id-cards');
    const user = await this.userRepo.updateProfile(userId, { idCardPhotoUrl: imageUrl });
    if (!user) throw new NotFoundError('User not found');
    return { idCardPhotoUrl: imageUrl };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepo.updatePassword(userId, hashedPassword);
  }

  async deleteAccount(userId: string) {
    await this.userRepo.softDelete(userId);
  }

  async submitKyc(userId: string, bankDetails: any, documents: any[]) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.kycStatus === KycStatus.APPROVED || user.kycStatus === KycStatus.PENDING) {
      throw new BadRequestError(`Cannot submit KYC when status is ${user.kycStatus}`);
    }

    const kycRequest = await KycRequest.findOneAndUpdate(
      { userId },
      { bankDetails, documents, status: KycStatus.PENDING, rejectionReason: null },
      { upsert: true, new: true }
    );

    user.kycStatus = KycStatus.PENDING;
    user.bankDetails = bankDetails;
    await user.save();

    return kycRequest;
  }
}
