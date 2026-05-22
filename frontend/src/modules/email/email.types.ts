export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'kyc_update' 
  | 'booking_reminder' 
  | 'payment_due'
  | 'booking_confirmed'
  | 'payment_received'
  | 'order_update';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OtpRecord {
  id: string;
  email: string;
  code_hash: string;
  purpose: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  created_at: string;
}
