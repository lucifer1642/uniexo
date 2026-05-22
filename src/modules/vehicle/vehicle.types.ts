export interface VehicleRow {
  id: string;
  vendor_id: string;
  name: string;
  type: 'car' | 'bike';
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  fuel_type: string;
  seating_capacity: number;
  price_per_hour: number | null;
  price_per_day: number;
  description: string | null;
  location: string | null;
  images: string[];
  features: string[];
  is_available: boolean;
  approval_status: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithVendor extends VehicleRow {
  vendor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface VehicleInput {
  name: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  fuel_type: string;
  seating_capacity: number;
  price_per_hour?: number;
  price_per_day: number;
  description?: string;
  location?: string;
  images?: string[];
}
