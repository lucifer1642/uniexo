import crypto from 'crypto';
import mongoose from 'mongoose';
import { PaymentRepository } from './payment.repository';
import { razorpayInstance } from '../../config/razorpay';
import { env } from '../../config/env';
import { Booking, Order, Wallet, Transaction, User, VendorProfile } from '../../database/models';
import { EmailService } from '../../services/email.service';
import { PaymentStatus, BookingStatus, OrderStatus, TransactionType, ServiceType } from '../../types/enums';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { generateReceiptId } from '../../utils/helpers';
import { logger } from '../../config/logger';
import { PaginationQuery } from '../../types';

export class PaymentService {
  private paymentRepo: PaymentRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
  }

  async createOrder(
    userId: string,
    data: {
      serviceType: ServiceType;
      referenceId: string;
      amount: number;
    },
  ) {
    const receipt = generateReceiptId();

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(data.amount * 100),
      currency: 'INR',
      receipt,
      notes: {
        userId,
        serviceType: data.serviceType,
        referenceId: data.referenceId,
      },
    });

    // Store payment attempt
    const payment = await this.paymentRepo.create({
      userId: userId as any,
      serviceType: data.serviceType,
      referenceId: data.referenceId as any,
      amount: data.amount,
      razorpayOrderId: razorpayOrder.id,
      receipt,
      status: PaymentStatus.CREATED,
    });

    return {
      payment,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    // Verify Razorpay signature
    const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== data.razorpay_signature) {
      throw new BadRequestError('Invalid payment signature');
    }

    const payment = await this.paymentRepo.findByRazorpayOrderId(data.razorpay_order_id);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Use MongoDB transaction for atomic updates
    const session = await mongoose.startSession();
    session.startTransaction();
    let emailContext:
      | {
          userId: string;
          vendorId: string;
          serviceType: ServiceType;
          bookingId: string;
          amount: number;
          startDate: string;
          endDate: string;
        }
      | null = null;

    try {
      // Update payment status
      payment.razorpayPaymentId = data.razorpay_payment_id;
      payment.razorpaySignature = data.razorpay_signature;
      payment.status = PaymentStatus.CAPTURED;
      await payment.save({ session });

      // Update booking/order status
      if (payment.serviceType === ServiceType.VEHICLE || payment.serviceType === ServiceType.HOUSE) {
        await Booking.findByIdAndUpdate(
          payment.referenceId,
          { status: BookingStatus.CONFIRMED, paymentId: payment._id },
          { session },
        );

        // Get booking to find vendor
        const booking = await Booking.findById(payment.referenceId).session(session);
        if (booking) {
          const vendorAmount = payment.amount - booking.commissionAmount;

          // Credit vendor wallet
          const wallet = await Wallet.findOneAndUpdate(
            { userId: booking.vendorId },
            { $inc: { balance: vendorAmount } },
            { session, new: true, upsert: true },
          );

          // Record transaction
          await Transaction.create(
            [
              {
                walletId: wallet._id,
                userId: booking.vendorId,
                type: TransactionType.CREDIT,
                amount: vendorAmount,
                description: `Payment for ${payment.serviceType} booking`,
                referenceId: booking._id,
                serviceType: payment.serviceType,
                balanceAfter: wallet.balance,
              },
            ],
            { session },
          );

          // Record commission transaction (admin wallet)
          // Commission is retained by the platform
          logger.info(
            `Commission of ${booking.commissionAmount} retained for booking ${booking._id}`,
          );

          // Defer notification email until after transaction commit.
          emailContext = {
            userId: booking.userId.toString(),
            vendorId: booking.vendorId.toString(),
            serviceType: payment.serviceType,
            bookingId: booking._id.toString(),
            amount: payment.amount,
            startDate: booking.startDate.toISOString().split('T')[0],
            endDate: booking.endDate.toISOString().split('T')[0],
          };
        }
      } else if (payment.serviceType === ServiceType.LAUNDRY) {
        await Order.findByIdAndUpdate(
          payment.referenceId,
          { status: OrderStatus.PROCESSING, paymentId: payment._id },
          { session },
        );
      }

      await session.commitTransaction();
      logger.info(`Payment ${payment._id} verified and processed successfully`);

      if (emailContext) {
        try {
          const [userPopulated, vendorProfile] = await Promise.all([
            User.findById(emailContext.userId).select('name email'),
            VendorProfile.findOne({ userId: emailContext.vendorId }).populate('userId', 'name email'),
          ]);

          const vendorUser = vendorProfile?.userId as any;

          if (userPopulated && vendorUser && vendorUser.email) {
            await EmailService.sendBookingConfirmation(userPopulated.email, vendorUser.email, {
              serviceName:
                emailContext.serviceType === ServiceType.VEHICLE ? 'Vehicle Rental' : 'House Rental',
              serviceType: emailContext.serviceType,
              bookingId: emailContext.bookingId,
              amount: emailContext.amount,
              startDate: emailContext.startDate,
              endDate: emailContext.endDate,
              vendorPhone: vendorProfile?.businessPhone,
            });
          }
        } catch (emailErr) {
          logger.error('Failed to dispatch booking confirmation emails after payment', emailErr);
        }
      }

      return payment;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Payment verification transaction failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    // Validate webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestError('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    logger.info(`Razorpay webhook event: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const paymentEntity = event.payload.payment.entity;
        const payment = await this.paymentRepo.findByRazorpayOrderId(paymentEntity.order_id);
        if (payment && payment.status !== PaymentStatus.CAPTURED) {
          // Process same as verifyPayment
          await this.verifyPayment({
            razorpay_order_id: paymentEntity.order_id,
            razorpay_payment_id: paymentEntity.id,
            razorpay_signature: '', // Webhook already validated
          });
        }
        break;
      }
      case 'payment.failed': {
        const failedPayment = event.payload.payment.entity;
        const payment = await this.paymentRepo.findByRazorpayOrderId(failedPayment.order_id);
        if (payment) {
          await this.paymentRepo.update(payment._id.toString(), {
            status: PaymentStatus.FAILED,
          });
        }
        break;
      }
      default:
        logger.info(`Unhandled webhook event: ${event.event}`);
    }
  }

  async getPaymentById(id: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundError('Payment not found');
    return payment;
  }

  async getUserPayments(userId: string, query: PaginationQuery) {
    return this.paymentRepo.findByUser(userId, query);
  }

  async getAllPayments(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.paymentRepo.findAll(filter, query);
  }
}
