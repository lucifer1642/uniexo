import { User, IUser } from '../../database/models';
import { UserRole } from '../../types/enums';

export class AuthRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    isEmailVerified?: boolean;
    universityId?: string;
    location?: string;
  }): Promise<IUser> {
    return User.create(data);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
  }

  async verifyEmail(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { isEmailVerified: true });
  }

  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }
}
