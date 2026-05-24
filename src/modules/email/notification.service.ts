import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from './email.service';
import { genericEmailTemplate } from './templates/generic';
import { welcomeEmailTemplate } from './templates/welcome';
import { bookingConfirmedTemplate } from './templates/booking-confirmed';
import { paymentReceivedTemplate } from './templates/payment-received';
import type { NotificationType } from './email.types';

/**
 * Notification Service — creates in-platform notifications and sends emails.
 * ALL methods are fire-and-forget. NEVER throw. NEVER block the calling flow.
 */
export const notificationService = {
  /**
   * Core: Create an in-platform notification + optionally send email.
   */
  async notify(params: {
    userId: string;
    email?: string;
    title: string;
    message: string;
    type: NotificationType;
    emailSubject?: string;
    emailHtml?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // 1. Always insert in-platform notification
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        metadata: params.metadata || {},
      });
    } catch (e: any) {
      console.error('[NOTIFY] DB insert failed:', e.message);
    }

    // 2. Send email in background (if email provided and html provided)
    if (params.email && params.emailHtml) {
      sendEmail({
        to: params.email,
        subject: params.emailSubject || params.title,
        html: params.emailHtml,
      }).catch((e: any) => {
        console.error('[NOTIFY] Email send failed in background:', e.message);
      });
    }
  },

  // ── Convenience Methods ────────────────────────────────────

  async onSignup(userId: string, email: string, name: string) {
    await this.notify({
      userId,
      email,
      title: 'Welcome to UniExo!',
      message: `Hi ${name}, your account has been created successfully. Start exploring the platform!`,
      type: 'success',
      emailSubject: 'Welcome to UniExo — Your Account is Ready!',
      emailHtml: welcomeEmailTemplate(name),
    });
  },

  async onLogin(userId: string, email: string, name: string) {
    await this.notify({
      userId,
      title: 'New Login Detected',
      message: `Hi ${name}, you just logged in to UniExo.`,
      type: 'info',
    });
  },

  async onPasswordChanged(userId: string, email: string, name: string) {
    await this.notify({
      userId,
      email,
      title: 'Password Changed',
      message: 'Your UniExo password was recently changed. If this wasn\'t you, please reset it immediately.',
      type: 'warning',
      emailSubject: 'UniExo — Password Changed',
      emailHtml: genericEmailTemplate('Password Changed', 'Your password was updated successfully. If you did not make this change, please reset your password immediately.'),
    });
  },

  async onBookingCreated(userId: string, email: string, name: string, serviceName: string, amount: number) {
    await this.notify({
      userId,
      email,
      title: 'Booking Confirmed',
      message: `Your booking for "${serviceName}" has been confirmed. Total: ₹${amount}`,
      type: 'booking_confirmed',
      emailSubject: `UniExo — Booking Confirmed: ${serviceName}`,
      emailHtml: bookingConfirmedTemplate(name, serviceName, amount),
    });
  },

  async onPaymentReceived(userId: string, email: string, name: string, amount: number, txnId: string) {
    await this.notify({
      userId,
      email,
      title: 'Payment Received',
      message: `Payment of ₹${amount} received. Transaction ID: ${txnId}`,
      type: 'payment_received',
      emailSubject: `UniExo — Payment of ₹${amount} Received`,
      emailHtml: paymentReceivedTemplate(name, amount, txnId),
    });
  },

  async onBookingCancelled(userId: string, email: string, serviceName: string) {
    await this.notify({
      userId,
      email,
      title: 'Booking Cancelled',
      message: `Your booking for "${serviceName}" has been cancelled.`,
      type: 'danger',
      emailSubject: `UniExo — Booking Cancelled: ${serviceName}`,
      emailHtml: genericEmailTemplate('Booking Cancelled', `Your booking for "${serviceName}" has been cancelled. If this was a mistake, please rebook.`),
    });
  },

  async onKycUpdate(userId: string, email: string, name: string, status: string) {
    await this.notify({
      userId,
      email,
      title: 'KYC Status Updated',
      message: `Your KYC verification status has been updated to: ${status.toUpperCase()}`,
      type: 'kyc_update',
      emailSubject: `UniExo — KYC ${status.toUpperCase()}`,
      emailHtml: genericEmailTemplate('KYC Verification Update', `Hi ${name}, your KYC verification status is now: ${status.toUpperCase()}.`),
    });
  },

  async onVendorListingApproved(userId: string, email: string, listingTitle: string) {
    await this.notify({
      userId,
      email,
      title: 'Listing Approved',
      message: `Your listing "${listingTitle}" has been approved and is now live!`,
      type: 'success',
      emailSubject: `UniExo — Listing Approved: ${listingTitle}`,
      emailHtml: genericEmailTemplate('Listing Approved', `Your listing "${listingTitle}" has been approved and is now live on UniExo!`),
    });
  },

  async onOrderStatusUpdate(userId: string, email: string, orderId: string, status: string) {
    await this.notify({
      userId,
      email,
      title: 'Order Update',
      message: `Order #${orderId} status: ${status}`,
      type: 'order_update',
      emailSubject: `UniExo — Order #${orderId} Update`,
      emailHtml: genericEmailTemplate('Order Update', `Your order #${orderId} is now: ${status}.`),
    });
  },
};
