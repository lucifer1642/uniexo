export type PropertyType = 'pg' | 'room';

export interface FAQ {
  question: string;
  answer: string;
}

export interface Amenities {
  commonAmenities?: string[];
  roomAmenities?: string[];
  servicesAmenities?: string[];
  foodAmenities?: string[];
}

export interface HouseRow {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  room_size: string;
  bed_type: string;
  price_per_month: number | null;
  price_per_day: number | null;
  single_sharing_price: number | null;
  double_sharing_price: number | null;
  triple_sharing_price: number | null;
  security_deposit: number | null;
  lockin_period: string;
  notice_period: string;
  electricity_included: boolean;
  electricity_charge: number | null;
  location_url: string;
  tenants_staying: number;
  faqs: FAQ[];
  amenities: Amenities;
  images: string[];
  is_available: boolean;
  approval_status: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface HouseWithVendor extends HouseRow {
  vendor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface HouseInput {
  title: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  roomSize?: string;
  bedType?: string;
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
  locationUrl?: string;
  tenantsStaying?: number;
  faqs?: FAQ[];
  amenities?: Amenities;
  images?: string[];
}
