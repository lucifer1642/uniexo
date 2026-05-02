// ==================== Enums ====================

export type UserRole = 'user' | 'vendor' | 'admin';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';

export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'picked_up'
  | 'in_progress'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type VendorApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ListingApprovalStatus = 'pending' | 'approved' | 'rejected';

export type TransactionType = 'credit' | 'debit' | 'commission' | 'refund' | 'withdrawal';

export type ServiceType = 'vehicle' | 'house' | 'laundry' | 'marketplace';

// ==================== Models ====================

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  avatar?: string;
  universityId?: string;
  location?: string;
  idCardPhotoUrl?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile {
  _id: string;
  userId: User | string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessType?: string;
  serviceType?: string;
  description?: string;
  documents: string[];
  approvalStatus: VendorApprovalStatus;
  rejectionReason?: string;
  rank: number;
  onsitePickup: boolean;
  onStoreService: boolean;
  onsitePickupCharge: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  vendorId: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  pricePerHour?: number;
  pricePerDay: number;
  images: string[];
  features: string[];
  isAvailable: boolean;
  approvalStatus: ListingApprovalStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface House {
  _id: string;
  vendorId: any;
  title: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pricePerMonth?: number;
  pricePerDay?: number;
  singleSharingPrice?: number;
  doubleSharingPrice?: number;
  tripleSharingPrice?: number;
  securityDeposit?: number;
  lockinPeriod?: string;
  noticePeriod?: string;
  electricityIncluded?: boolean;
  electricityCharge?: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  amenities: string[];
  commonAmenities: string[];
  roomAmenities: string[];
  servicesAmenities: string[];
  foodAmenities: string[];
  locationUrl?: string;
  tenantsStaying?: number;
  faqs?: { question: string; answer: string }[];
  isAvailable: boolean;
  approvalStatus: ListingApprovalStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LaundryService {
  _id: string;
  vendorId?: string;
  name: string;
  description: string;
  providerName: string;
  providerPhone: string;
  providerAddress: string;
  services: { name: string; price: number; unit: string }[];
  images: string[];
  rank: number;
  onsitePickup: boolean;
  onStoreService: boolean;
  onsitePickupCharge: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceItem {
  _id: string;
  sellerId: User | string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  images: string[];
  location: string;
  isSold: boolean;
  isReported: boolean;
  reportCount: number;
  reportReasons: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  userId: User | string;
  vendorId: User | string;
  serviceType: ServiceType;
  serviceId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  bookingType?: 'hourly' | 'daily';
  paymentMethod?: 'online';
  status: BookingStatus;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: User | string;
  serviceId: string;
  items: string[];
  totalAmount: number;
  status: OrderStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  userId: User | string;
  bookingId?: string;
  orderId?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  walletId: string;
  userId: User | string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  serviceType?: ServiceType;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  userId: User | string;
  serviceType: ServiceType;
  serviceId: string;
  rating: number;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSetting {
  _id: string;
  key: string;
  value: unknown;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== API Response ====================

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== Dashboard ====================

export interface DashboardCounts {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  totalVehicles: number;
  totalHouses: number;
  totalBookings: number;
  totalOrders: number;
  totalPayments: number;
  totalMarketplaceItems: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  totalRevenue: number;
  recentBookings: Booking[];
  recentPayments: Payment[];
}
