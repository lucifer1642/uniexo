import { Booking } from '../database/models/Booking';
import { NotificationService } from '../services/notification.service';
import { logger } from '../config/logger';

export class ReminderJob {
  static async run() {
    logger.info('Running Payment Reminder Job...');
    
    try {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      // Find bookings with pending installments due in the next 3 days
      const bookingsWithDuePayments = await Booking.find({
        'installments.status': 'pending',
        'installments.dueDate': { $lte: threeDaysLater, $gte: today },
        isDeleted: false,
      });

      for (const booking of bookingsWithDuePayments) {
        if (!booking.installments) continue;

        for (const installment of booking.installments) {
          if (installment.status === 'pending' && installment.dueDate <= threeDaysLater && installment.dueDate >= today) {
            await NotificationService.sendPaymentReminder(
              booking.userId.toString(),
              installment.amount,
              installment.dueDate
            );
            logger.info(`Sent payment reminder to user ${booking.userId} for installment ${installment.month}`);
          }
        }
      }

      logger.info('Payment Reminder Job completed.');
    } catch (err) {
      logger.error('Error in Payment Reminder Job:', err);
    }
  }
}
