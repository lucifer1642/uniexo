export interface BookingRow {
  id: string;
  user_id: string;
  vendor_id: string;
  service_type: string;
  service_id: string;
  start_date: string;
  end_date: string;
  booking_type: string;
   total_amount: number;
   security_deposit: number;
   monthly_rent: number;
   total_months: number;
   status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  booking_id: string | null;
  service_type: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  created_at: string;
}

export interface CreateBookingInput {
  userId: string;
  serviceType: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  bookingType?: string;
   notes?: string;
   paymentMethod?: string;
   securityDeposit?: number;
   monthlyRent?: number;
   totalMonths?: number;
}

export interface CreateOrderInput {
  userId: string;
  serviceType: string;
  referenceId: string;
  amount: number;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
