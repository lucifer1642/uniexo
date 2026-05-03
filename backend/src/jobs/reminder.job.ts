import { supabase } from '../config/supabase';
import { NotificationService } from '../services/notification.service';
import { logger } from '../config/logger';

export class ReminderJob {
  static async run() {
    logger.info('Running Payment Reminder Job...');

    try {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      const todayIso = today.toISOString().split('T')[0];
      const laterIso = threeDaysLater.toISOString().split('T')[0];

      const { data: bookingsWithDuePayments, error } = await supabase
        .from('bookings')
        .select('id, user_id, installments');

      if (error) throw error;

      for (const booking of bookingsWithDuePayments ?? []) {
        const installments = (booking as { installments?: { status: string; amount: number; dueDate?: string }[] }).installments;
        if (!installments?.length) continue;

        for (const installment of installments) {
          if (installment.status !== 'pending' || !installment.dueDate) continue;

          const dueDay = new Date(installment.dueDate).toISOString().split('T')[0];
          if (dueDay >= todayIso && dueDay <= laterIso) {
            await NotificationService.sendPaymentReminder(
              String((booking as { user_id: string }).user_id),
              installment.amount,
              new Date(installment.dueDate),
            );
            logger.info(
              `Sent payment reminder to user ${(booking as { user_id: string }).user_id} for installment`,
            );
          }
        }
      }

      logger.info('Payment Reminder Job completed.');
    } catch (err) {
      logger.error('Error in Payment Reminder Job:', err);
    }
  }
}
