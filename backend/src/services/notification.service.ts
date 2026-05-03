import { NotificationType } from '../types/enums';
import { supabase } from '../config/supabase';
import { EmailService } from './email.service';
import { logger } from '../config/logger';

export class NotificationService {
  static async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    metadata?: Record<string, unknown>,
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        metadata: metadata ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    NotificationService.sendEmailNotification(userId, title, message, metadata).catch((err) => {
      logger.error(`Error in background email notification for user ${userId}:`, err);
    });

    return data;
  }

  private static async sendEmailNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();

    const email = (user as { email?: string })?.email;
    if (email) {
      await EmailService.sendGenericNotification(email, title, message, metadata);
    }
  }

  static async getForUser(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (
      data?.map((n: Record<string, unknown>) => ({
        ...n,
        _id: n.id,
        isRead: n.is_read,
        createdAt: n.created_at,
      })) ?? []
    );
  }

  static async markAsRead(notificationId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  }

  static async markAllAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }

  static async sendKycUpdate(userId: string, status: string, reason?: string) {
    const title = `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    let message = `Your KYC verification request has been ${status}.`;
    if (status === 'approved') {
      message += ' You can now fully access all features of the platform.';
    } else if (status === 'rejected' && reason) {
      message += ` Reason: ${reason}`;
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type: status === 'approved' ? NotificationType.SUCCESS : NotificationType.DANGER,
      metadata: { status, reason },
    });

    if (error) {
      logger.error('Failed to persist KYC notification', error);
    }

    const { data: user } = await supabase.from('profiles').select('email, name').eq('id', userId).maybeSingle();

    const u = user as { email?: string; name?: string } | null;
    if (u?.email) {
      EmailService.sendKycStatusEmail(
        u.email,
        u.name || 'User',
        status as 'approved' | 'rejected',
        reason,
      ).catch((err) => {
        logger.error(`Error sending specialized KYC email to ${u.email}:`, err);
      });
    }

    return { ok: true };
  }

  static async sendPaymentReminder(userId: string, amount: number, dueDate: Date) {
    const title = 'Payment Due Reminder';
    const message = `A payment of ₹${amount} is due on ${dueDate.toLocaleDateString()}. Please ensure timely payment to avoid service interruption.`;

    return this.create(userId, title, message, NotificationType.PAYMENT_DUE, {
      amount,
      dueDate: dueDate.toISOString(),
    });
  }
}
