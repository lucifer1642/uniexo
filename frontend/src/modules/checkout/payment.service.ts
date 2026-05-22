import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CreateOrderInput, VerifyPaymentInput } from './checkout.types';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

function getRazorpayInstance() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

export const paymentService = {
  /**
   * Create a Razorpay order and store payment record.
   */
  async createOrder(input: CreateOrderInput): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const rzp = getRazorpayInstance();
      if (!rzp) {
        return { success: false, error: 'Payment gateway is not configured. Please add Razorpay credentials.' };
      }

      const amountInPaise = Math.round(input.amount * 100);

      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${input.referenceId.slice(0, 30)}`,
      });

      // Store payment record
      await supabaseAdmin.from('payments').insert({
        user_id: input.userId,
        booking_id: input.referenceId,
        service_type: input.serviceType,
        razorpay_order_id: order.id,
        amount: input.amount,
        currency: 'INR',
        status: 'created',
      });

      return {
        success: true,
        data: {
          key: RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          razorpayOrderId: order.id,
        },
      };
    } catch (err: any) {
      console.error('[PAYMENT SERVICE] createOrder error:', err);
      return { success: false, error: 'Failed to create payment order.' };
    }
  },

  /**
   * Verify Razorpay payment signature and update booking status.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<{ success: boolean; error?: string }> {
    try {
      if (!RAZORPAY_KEY_SECRET) {
        return { success: false, error: 'Payment gateway not configured.' };
      }

      // Verify signature
      const body = input.razorpay_order_id + '|' + input.razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== input.razorpay_signature) {
        // Update payment as failed
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed' })
          .eq('razorpay_order_id', input.razorpay_order_id);

        return { success: false, error: 'Payment verification failed. Invalid signature.' };
      }

      // Update payment as captured
      await supabaseAdmin
        .from('payments')
        .update({
          razorpay_payment_id: input.razorpay_payment_id,
          razorpay_signature: input.razorpay_signature,
          status: 'captured',
        })
        .eq('razorpay_order_id', input.razorpay_order_id);

      // Find the booking and mark as confirmed + paid
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('booking_id')
        .eq('razorpay_order_id', input.razorpay_order_id)
        .maybeSingle();

      if (payment?.booking_id) {
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.booking_id);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PAYMENT SERVICE] verifyPayment error:', err);
      return { success: false, error: 'Payment verification failed.' };
    }
  },
};
