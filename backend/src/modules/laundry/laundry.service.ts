import { LaundryRepository } from './laundry.repository';
import { AdminSettings } from '../../database/models';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { env } from '../../config/env';

export class LaundryServiceModule {
  private laundryRepo: LaundryRepository;

  constructor() {
    this.laundryRepo = new LaundryRepository();
  }

  // Admin-only: Add laundry provider
  async createService(data: {
    name: string;
    description: string;
    providerName: string;
    providerPhone: string;
    providerAddress: string;
    services: { name: string; price: number; unit: string }[];
  }) {
    return this.laundryRepo.createService(data);
  }

  async getServiceById(id: string) {
    const service = await this.laundryRepo.findServiceById(id);
    if (!service) throw new NotFoundError('Laundry service not found');
    return service;
  }

  async listServices(query: PaginationQuery) {
    return this.laundryRepo.findAllServices({ isActive: true }, query);
  }

  async updateService(id: string, data: Record<string, unknown>) {
    const service = await this.laundryRepo.findServiceById(id);
    if (!service) throw new NotFoundError('Laundry service not found');
    return this.laundryRepo.updateService(id, data as any);
  }

  async deleteService(id: string) {
    await this.laundryRepo.deleteService(id);
  }

  // User: Place order 
  async placeOrder(
    userId: string,
    data: {
      laundryServiceId: string;
      items: { serviceName: string; quantity: number }[];
      deliveryAddress: string;
      pickupType?: 'onsite' | 'store';
      pickupDate?: string;
      notes?: string;
    },
  ) {
    const laundryService = await this.laundryRepo.findServiceById(data.laundryServiceId);
    if (!laundryService) throw new NotFoundError('Laundry service not found');
    if (!laundryService.isActive) throw new BadRequestError('Laundry service is not active');

    const pickupType = data.pickupType || 'store';

    // Validate pickup type against vendor settings
    if (pickupType === 'onsite' && !laundryService.onsitePickup) {
      throw new BadRequestError('This vendor does not offer onsite pickup');
    }
    if (pickupType === 'store' && !laundryService.onStoreService) {
      throw new BadRequestError('This vendor does not offer in-store service');
    }

    // Calculate totals
    const orderItems = data.items.map((item) => {
      const serviceDetail = laundryService.services.find((s) => s.name === item.serviceName);
      if (!serviceDetail) throw new BadRequestError(`Service "${item.serviceName}" not found`);
      return {
        serviceName: item.serviceName,
        quantity: item.quantity,
        pricePerUnit: serviceDetail.price,
        total: serviceDetail.price * item.quantity,
      };
    });

    const itemsTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Add onsite pickup charge if applicable
    const onsitePickupCharge = pickupType === 'onsite' ? (laundryService.onsitePickupCharge || 0) : 0;
    const totalAmount = itemsTotal + onsitePickupCharge;

    // Get commission
    const commissionSetting = await AdminSettings.findOne({ key: 'commission_percent' });
    const commissionPercent = commissionSetting
      ? (commissionSetting.value as number)
      : env.DEFAULT_COMMISSION_PERCENT;
    const commissionAmount = (totalAmount * commissionPercent) / 100;

    const order = await this.laundryRepo.createOrder({
      userId: userId as any,
      laundryServiceId: data.laundryServiceId as any,
      items: orderItems,
      totalAmount,
      commissionAmount,
      commissionPercent,
      deliveryAddress: data.deliveryAddress,
      pickupType,
      onsitePickupCharge,
      pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
      notes: data.notes,
    });

    return order;
  }

  async getOrderById(id: string) {
    const order = await this.laundryRepo.findOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getUserOrders(userId: string, query: PaginationQuery) {
    return this.laundryRepo.findOrdersByUser(userId, query);
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.laundryRepo.findOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return this.laundryRepo.updateOrderStatus(orderId, status);
  }

  async listAllOrders(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.laundryRepo.findAllOrders(filter, query);
  }

  // Vendor: get own service
  async getVendorService(vendorUserId: string) {
    const { LaundryService: LaundryModel } = require('../../database/models');
    const service = await LaundryModel.findOne({ vendorId: vendorUserId, isDeleted: false });
    return service;
  }

  // Vendor: update own service toggles
  async updateVendorService(vendorUserId: string, data: {
    onsitePickup?: boolean;
    onStoreService?: boolean;
    onsitePickupCharge?: number;
  }) {
    const { LaundryService: LaundryModel } = require('../../database/models');
    const service = await LaundryModel.findOne({ vendorId: vendorUserId, isDeleted: false });
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    if (typeof data.onsitePickup === 'boolean') service.onsitePickup = data.onsitePickup;
    if (typeof data.onStoreService === 'boolean') service.onStoreService = data.onStoreService;
    if (typeof data.onsitePickupCharge === 'number') service.onsitePickupCharge = data.onsitePickupCharge;

    // Ensure at least one service mode is active
    if (!service.onsitePickup && !service.onStoreService) {
      throw new BadRequestError('At least one service mode (onsite or store) must be enabled');
    }

    await service.save();
    return service;
  }

  // Vendor: get all orders for their laundry service
  async getVendorOrders(vendorUserId: string, query: PaginationQuery, status?: string) {
    const { LaundryService: LaundryModel } = require('../../database/models');
    const { Order } = require('../../database/models');

    const service = await LaundryModel.findOne({ vendorId: vendorUserId, isDeleted: false });
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    const filter: Record<string, unknown> = { laundryServiceId: service._id };
    if (status) filter.status = status;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Stats per status
    const allOrders = await Order.find({ laundryServiceId: service._id }).lean() as any[];
    const statusCounts: Record<string, number> = {};
    for (const o of allOrders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }
    const totalRevenue = allOrders
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (o.totalAmount - (o.commissionAmount || 0)), 0);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      statusCounts,
      totalRevenue,
      serviceName: service.name,
    };
  }

  // Vendor: update order status (pipeline progression)
  async updateVendorOrderStatus(vendorUserId: string, orderId: string, status: string) {
    const { LaundryService: LaundryModel } = require('../../database/models');
    const { Order } = require('../../database/models');

    const service = await LaundryModel.findOne({ vendorId: vendorUserId, isDeleted: false });
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    const order = await Order.findOne({ _id: orderId, laundryServiceId: service._id });
    if (!order) throw new NotFoundError('Order not found or does not belong to your service');

    const validStatuses = ['placed', 'processing', 'picked_up', 'in_progress', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) throw new BadRequestError('Invalid status');

    order.status = status as any;
    await order.save();
    return order;
  }
}
