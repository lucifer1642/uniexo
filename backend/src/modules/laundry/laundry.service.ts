import { LaundryRepository } from './laundry.repository';
import { supabase } from '../../config/supabase';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { env } from '../../config/env';

async function getCommissionPercent(): Promise<number> {
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'commission_percent')
    .maybeSingle();
  const raw = data?.value as unknown;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  return env.DEFAULT_COMMISSION_PERCENT;
}

export class LaundryServiceModule {
  private laundryRepo: LaundryRepository;

  constructor() {
    this.laundryRepo = new LaundryRepository();
  }

  async createService(data: {
    name: string;
    description: string;
    providerName: string;
    providerPhone: string;
    providerAddress: string;
    services: { name: string; price: number; unit: string }[];
    vendorId?: string;
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
    const isActive = laundryService.is_active ?? laundryService.isActive ?? true;
    if (!isActive) throw new BadRequestError('Laundry service is not active');

    const pickupType = data.pickupType || 'store';

    const onsite = laundryService.onsite_pickup ?? laundryService.onsitePickup;
    const store = laundryService.on_store_service ?? laundryService.onStoreService;

    if (pickupType === 'onsite' && !onsite) {
      throw new BadRequestError('This vendor does not offer onsite pickup');
    }
    if (pickupType === 'store' && !store) {
      throw new BadRequestError('This vendor does not offer in-store service');
    }

    const orderItems = data.items.map((item) => {
      const serviceDetail = (laundryService.services as any[]).find((s: any) => s.name === item.serviceName);
      if (!serviceDetail) throw new BadRequestError(`Service "${item.serviceName}" not found`);
      return {
        serviceName: item.serviceName,
        quantity: item.quantity,
        pricePerUnit: serviceDetail.price,
        total: serviceDetail.price * item.quantity,
      };
    });

    const itemsTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    const onsiteChargeRaw = laundryService.onsite_pickup_charge ?? laundryService.onsitePickupCharge ?? 0;
    const onsitePickupCharge = pickupType === 'onsite' ? onsiteChargeRaw : 0;
    const totalAmount = itemsTotal + onsitePickupCharge;

    const commissionPercent = await getCommissionPercent();
    const commissionAmount = (totalAmount * commissionPercent) / 100;

    const order = await this.laundryRepo.createOrder({
      userId,
      laundryServiceId: data.laundryServiceId,
      items: orderItems,
      totalAmount,
      commissionAmount,
      commissionPercent,
      pickupAddress: data.deliveryAddress,
      pickupPhone: '',
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

  async getVendorService(vendorUserId: string) {
    const service = await this.laundryRepo.findServicesByVendorUserId(vendorUserId);
    return service || null;
  }

  async updateVendorService(
    vendorUserId: string,
    data: {
      onsitePickup?: boolean;
      onStoreService?: boolean;
      onsitePickupCharge?: number;
    },
  ) {
    const service = await this.laundryRepo.findServicesByVendorUserId(vendorUserId);
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    const patch: Record<string, unknown> = {};
    if (typeof data.onsitePickup === 'boolean') patch.onsite_pickup = data.onsitePickup;
    if (typeof data.onStoreService === 'boolean') patch.on_store_service = data.onStoreService;
    if (typeof data.onsitePickupCharge === 'number') patch.onsite_pickup_charge = data.onsitePickupCharge;

    const onsitePickup = patch.onsite_pickup ?? service.onsite_pickup ?? service.onsitePickup;
    const onStoreService = patch.on_store_service ?? service.on_store_service ?? service.onStoreService;

    if (!onsitePickup && !onStoreService) {
      throw new BadRequestError('At least one service mode (onsite or store) must be enabled');
    }

    return this.laundryRepo.updateService(service.id, patch);
  }

  async getVendorOrders(vendorUserId: string, query: PaginationQuery, status?: string) {
    const service = await this.laundryRepo.findServicesByVendorUserId(vendorUserId);
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    const page = query.page || 1;
    const limit = query.limit || 20;

    const { rows: orders, total } = await this.laundryRepo.findOrdersPaged(service.id, page, limit, status);

    const allOrders = await this.laundryRepo.findOrdersForService(service.id);
    const statusCounts: Record<string, number> = {};
    for (const o of allOrders) {
      const st = (o as any).status;
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }
    const totalRevenue =
      allOrders
        ?.filter((o: any) => o.status !== 'cancelled')
        .reduce(
          (s: number, o: any) => s + (Number(o.total_amount ?? o.totalAmount ?? 0) - Number(o.commission_amount ?? o.commissionAmount ?? 0)),
          0,
        ) ?? 0;

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      statusCounts,
      totalRevenue,
      serviceName: service.name ?? service.provider_name,
    };
  }

  async updateVendorOrderStatus(vendorUserId: string, orderId: string, status: string) {
    const service = await this.laundryRepo.findServicesByVendorUserId(vendorUserId);
    if (!service) throw new NotFoundError('No laundry service found for this vendor');

    const order = await this.laundryRepo.findOrderById(orderId);
    if (!order || String(order.laundry_service_id ?? order.laundryServiceId) !== String(service.id)) {
      throw new NotFoundError('Order not found or does not belong to your service');
    }

    const validStatuses = ['placed', 'processing', 'picked_up', 'in_progress', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) throw new BadRequestError('Invalid status');

    const updated = await this.laundryRepo.updateOrderStatus(orderId, status);
    if (!updated) throw new NotFoundError('Order not found');
    return updated;
  }
}
