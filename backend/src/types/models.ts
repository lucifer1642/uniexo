import { ListingApprovalStatus, UserRole, VendorApprovalStatus, BookingStatus, PaymentStatus } from './enums';

export interface IBaseEntity {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isDeleted?: boolean;
}

export interface IUser extends IBaseEntity {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  location?: string;
  universityId?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  isEmailVerified: boolean;
  isSuspended: boolean;
  businessName?: string;
  serviceType?: string;
}

export interface IVehicle extends IBaseEntity {
  vendorId: string;
  name: string;
  type: string;
  brand: string;
  modelName: string;
  year: number;
  registrationNumber: string;
  fuelType: string;
  seatingCapacity: number;
  pricePerHour?: number;
  pricePerDay: number;
  images: string[];
  description?: string;
  features: string[];
  location: string;
  availability: {
    startDate: string | Date;
    endDate: string | Date;
  }[];
  approvalStatus: ListingApprovalStatus;
  rejectionReason?: string;
  rank: number;
  isAvailable: boolean;
  currentStatus: 'available' | 'dispatched' | 'maintenance';
  dispatchedAt?: string | Date;
  expectedReturnAt?: string | Date;
  currentBookingId?: string;
  odometerOut?: number;
  odometerIn?: number;
  dispatchNotes?: string;
}

export interface IHouse extends IBaseEntity {
  vendorId: string;
  title: string;
  description: string;
  propertyType: 'pg' | 'flat' | 'room';
  address: string;
  city: string;
  state: string;
  pincode: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  roomSize?: string;
  bedType?: string;
  tenantsStaying?: number;
  pricePerMonth?: number;
  pricePerDay?: number;
  pricePerHour?: number;
  singleSharingPrice?: number;
  doubleSharingPrice?: number;
  tripleSharingPrice?: number;
  securityDeposit?: number;
  lockinPeriod?: string;
  noticePeriod?: string;
  electricityIncluded?: boolean;
  electricityCharge?: number;
  locationUrl?: string;
  images: string[];
  amenities?: string[];
  commonAmenities?: string[];
  roomAmenities?: string[];
  servicesAmenities?: string[];
  foodAmenities?: string[];
  approvalStatus: ListingApprovalStatus;
  isAvailable: boolean;
  rank: number;
  faqs?: { question: string; answer: string }[];
}

export interface IBooking extends IBaseEntity {
  userId: string;
  vendorId: string;
  serviceId: string;
  serviceType: 'vehicle' | 'house' | 'laundry' | 'marketplace';
  startDate: string | Date;
  endDate: string | Date;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

export interface IMarketplaceItem extends IBaseEntity {
  sellerId: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  price: number;
  images: string[];
  location: string;
  isSold: boolean;
  reports?: { reporterId: string; reason: string; date: string | Date }[];
}

export interface IMessage extends IBaseEntity {
  senderId: string;
  receiverId: string;
  itemId?: string;
  content: string;
  isRead: boolean;
}

export interface IOffer extends IBaseEntity {
  itemId: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
}
