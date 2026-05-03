export enum UserRole {
  USER = 'user',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NONE = 'none',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
  KYC_UPDATE = 'kyc_update',
  BOOKING_REMINDER = 'booking_reminder',
  PAYMENT_DUE = 'payment_due',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderStatus {
  PLACED = 'placed',
  PROCESSING = 'processing',
  PICKED_UP = 'picked_up',
  IN_PROGRESS = 'in_progress',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum VendorApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ListingApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  COMMISSION = 'commission',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
}

export enum ServiceType {
  VEHICLE = 'vehicle',
  HOUSE = 'house',
  LAUNDRY = 'laundry',
  MARKETPLACE = 'marketplace',
}
