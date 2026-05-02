import { Notification, NotificationType } from '../database/models/Notification';
import { User } from '../database/models/User';
import { EmailService } from './email.service';
import { Types } from 'mongoose';
import { logger } from '../config/logger';

export class NotificationService {
  static async create(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    metadata?: Record<string, any>
  ) {
    // 1. Create database notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata,
    });

    // 2. Trigger background email notification
    this.sendEmailNotification(userId, title, message, metadata).catch(err => {
      logger.error(`Error in background email notification for user ${userId}:`, err);
    });

    return notification;
  }

  private static async sendEmailNotification(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    metadata?: any
  ) {
    const user = await User.findById(userId).select('email');
    if (user && user.email) {
      await EmailService.sendGenericNotification(user.email, title, message, metadata);
    }
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

    // 1. Create DB notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: status === 'approved' ? NotificationType.SUCCESS : NotificationType.DANGER,
      metadata: { status, reason },
    });

    // 2. Send Specialized Email
    const user = await User.findById(userId).select('email name');
    if (user && user.email) {
      EmailService.sendKycStatusEmail(user.email, user.name, status as 'approved' | 'rejected', reason).catch(err => {
        logger.error(`Error sending specialized KYC email to ${user.email}:`, err);
      });
    }

    return notification;
  }

  static async sendPaymentReminder(userId: string, amount: number, dueDate: Date) {
    const title = 'Payment Due Reminder';
    const message = `A payment of ₹${amount} is due on ${dueDate.toLocaleDateString()}. Please ensure timely payment to avoid service interruption.`;
    
    return this.create(userId, title, message, NotificationType.PAYMENT_DUE, { amount, dueDate });
  }
}
