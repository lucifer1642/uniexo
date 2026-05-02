import { User, IUser } from '../../database/models';

export class UserRepository {
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  async findByIdWithPassword(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('+password').exec();
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<IUser, 'name' | 'phone' | 'avatar' | 'idCardPhotoUrl' | 'universityId' | 'location'>>,
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, data, { new: true }).exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
  }

  async softDelete(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { isDeleted: true });
  }
}
