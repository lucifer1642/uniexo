import { Notification, NotificationType } from '../database/models/Notification';
import { Types } from 'mongoose';

export class NotificationService {
  static async create(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    metadata?: Record<string, any>
  ) {
    return Notification.create({
      userId,
      title,
      message,
      type,
      metadata,
    });
  }

  static async getForUser(userId: string) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
    return Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }

  static async sendKycUpdate(userId: string, status: string, reason?: string) {
    const title = `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    let message = `Your KYC verification request has been ${status}.`;
    if (status === 'approved') {
      message += ' You can now fully access all features of the platform.';
    } else if (status === 'rejected' && reason) {
      message += ` Reason: ${reason}`;
    }

    return this.create(userId, title, message, status === 'approved' ? NotificationType.SUCCESS : NotificationType.DANGER, { status, reason });
  }

  static async sendPaymentReminder(userId: string, amount: number, dueDate: Date) {
    const title = 'Payment Due Reminder';
    const message = `A payment of ₹${amount} is due on ${dueDate.toLocaleDateString()}. Please ensure timely payment to avoid service interruption.`;
    
    return this.create(userId, title, message, NotificationType.PAYMENT_DUE, { amount, dueDate });
  }
}
