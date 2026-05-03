import crypto from 'crypto';
import { PaymentRepository } from './payment.repository';
import { BookingRepository } from '../booking/booking.repository';
import { LaundryRepository } from '../laundry/laundry.repository';
import { WalletRepository } from '../wallet/wallet.repository';
import { UserRepository } from '../user/user.repository';
import { VendorRepository } from '../vendor/vendor.repository';
import { razorpayInstance } from '../../config/razorpay';
import { env } from '../../config/env';
import { EmailService } from '../../services/email.service';
import { PaymentStatus, BookingStatus, OrderStatus, TransactionType, ServiceType } from '../../types/enums';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { generateReceiptId } from '../../utils/helpers';
import { logger } from '../../config/logger';
import { PaginationQuery } from '../../types';

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private bookingRepo: BookingRepository;
  private laundryRepo: LaundryRepository;
  private walletRepo: WalletRepository;
  private userRepo: UserRepository;
  private vendorRepo: VendorRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.bookingRepo = new BookingRepository();
    this.laundryRepo = new LaundryRepository();
    this.walletRepo = new WalletRepository();
    this.userRepo = new UserRepository();
    this.vendorRepo = new VendorRepository();
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

    const payment = await this.paymentRepo.create({
      userId,
      serviceType: data.serviceType,
      referenceId: data.referenceId,
      amount: data.amount,
      razorpayOrderId: razorpayOrder.id,
      receipt,
      status: PaymentStatus.CREATED,
      currency: 'INR',
    });

    return {
      payment,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    options?: { skipSignatureVerification?: boolean },
  ) {
    if (!options?.skipSignatureVerification) {
      const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (!data.razorpay_signature || expectedSignature !== data.razorpay_signature) {
        throw new BadRequestError('Invalid payment signature');
      }
    }

    const paymentRow = await this.paymentRepo.findByRazorpayOrderId(data.razorpay_order_id);
    if (!paymentRow) {
      throw new NotFoundError('Payment not found');
    }

    if (paymentRow.status === PaymentStatus.CAPTURED) {
      return paymentRow;
    }

    const paymentId = String(paymentRow.id);

    await this.paymentRepo.update(paymentId, {
      razorpayPaymentId: data.razorpay_payment_id,
      razorpaySignature: options?.skipSignatureVerification ? '(webhook)' : data.razorpay_signature,
      status: PaymentStatus.CAPTURED,
    });

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

    const serviceType = paymentRow.serviceType as ServiceType;
    const referenceId = String(paymentRow.referenceId);

    try {
      if (serviceType === ServiceType.VEHICLE || serviceType === ServiceType.HOUSE) {
        const booking = await this.bookingRepo.findById(referenceId);
        await this.bookingRepo.update(referenceId, {
          status: BookingStatus.CONFIRMED,
          payment_id: paymentId,
        } as any);

        if (booking) {
          const vendorId = String((booking as any).vendor_id);
          const totalAmount = Number(paymentRow.amount);
          const commission = Number((booking as any).commission_amount || 0);
          const vendorAmount = Math.max(totalAmount - commission, 0);

          const credited = await this.walletRepo.incrementBalance(vendorId, vendorAmount);
          if (!credited) {
            logger.error(`Failed crediting vendor wallet ${vendorId} for booking ${referenceId}`);
          } else {
            await this.walletRepo.addTransaction({
              walletId: credited.walletId,
              userId: vendorId,
              type: TransactionType.CREDIT,
              amount: vendorAmount,
              description: `Payment for ${serviceType} booking`,
              referenceId: referenceId,
              serviceType,
              balanceAfter: credited.balance,
            });
          }

          logger.info(`Commission of ${commission} retained for booking ${referenceId}`);

          emailContext = {
            userId: String((booking as any).user_id),
            vendorId,
            serviceType,
            bookingId: referenceId,
            amount: totalAmount,
            startDate: new Date((booking as any).start_date).toISOString().split('T')[0],
            endDate: new Date((booking as any).end_date).toISOString().split('T')[0],
          };
        }
      } else if (serviceType === ServiceType.LAUNDRY) {
        await this.laundryRepo.patchOrder(referenceId, {
          status: OrderStatus.PROCESSING,
          payment_id: paymentId,
        } as any);
      }

      if (emailContext) {
        try {
          const [userPopulated, vendorProfile] = await Promise.all([
            this.userRepo.findById(emailContext.userId),
            this.vendorRepo.findByUserId(emailContext.vendorId),
          ]);

          const vendorUser = vendorProfile ? await this.userRepo.findById(emailContext.vendorId) : null;

          if (userPopulated?.email && vendorUser?.email) {
            await EmailService.sendBookingConfirmation(userPopulated.email, vendorUser.email, {
              serviceName:
                emailContext.serviceType === ServiceType.VEHICLE ? 'Vehicle Rental' : 'House Rental',
              serviceType: emailContext.serviceType,
              bookingId: emailContext.bookingId,
              amount: emailContext.amount,
              startDate: emailContext.startDate,
              endDate: emailContext.endDate,
              vendorPhone: vendorProfile?.business_phone,
            });
          }
        } catch (emailErr) {
          logger.error('Failed to dispatch booking confirmation emails after payment', emailErr);
        }
      }

      const updated = await this.paymentRepo.findByRazorpayOrderId(data.razorpay_order_id);
      logger.info(`Payment ${paymentId} verified and processed successfully`);
      return updated;
    } catch (error) {
      logger.error('Payment verification updates failed:', error);
      throw error;
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
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
          await this.verifyPayment(
            {
              razorpay_order_id: paymentEntity.order_id,
              razorpay_payment_id: paymentEntity.id,
              razorpay_signature: '',
            },
            { skipSignatureVerification: true },
          );
        }
        break;
      }
      case 'payment.failed': {
        const failedPayment = event.payload.payment.entity;
        const payment = await this.paymentRepo.findByRazorpayOrderId(failedPayment.order_id);
        if (payment) {
          await this.paymentRepo.update(String(payment.id), {
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
