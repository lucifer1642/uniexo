import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { House } from '@/types';

const REALTIME_INTERVAL = 3000;
const REALTIME_STALE = 2000;

function mapHouse(h: any): House {
    return {
        ...h,
        _id: h.id,
        vendorId: h.vendor || { _id: h.vendor_id },
        propertyType: h.property_type,
        pricePerMonth: h.price_per_month,
        pricePerDay: h.price_per_day,
        singleSharingPrice: h.single_sharing_price,
        doubleSharingPrice: h.double_sharing_price,
        tripleSharingPrice: h.triple_sharing_price,
        securityDeposit: h.security_deposit,
        lockinPeriod: h.lockin_period,
        noticePeriod: h.notice_period,
        electricityIncluded: h.electricity_included,
        electricityCharge: h.electricity_charge,
        locationUrl: h.location_url,
        tenantsStaying: h.tenants_staying,
        approvalStatus: h.approval_status,
        isAvailable: h.is_available,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        // Amenities mapping
        commonAmenities: h.amenities?.commonAmenities || [],
        roomAmenities: h.amenities?.roomAmenities || [],
        servicesAmenities: h.amenities?.servicesAmenities || [],
        foodAmenities: h.amenities?.foodAmenities || [],
    } as House;
}

export const useHouses = (filters: any = {}) => {
    return useQuery({
        queryKey: ['houses', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.propertyType) params.set('propertyType', filters.propertyType);
            const res = await fetch(`/api/houses?${params.toString()}`);
            const json = await res.json();
            if (!json.success) return [];
            return (json.data || []).map(mapHouse);
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useHouse = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['house', id],
        queryFn: async () => {
            const res = await fetch(`/api/houses/${id}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Property not found');
            return mapHouse(json.data);
        },
        enabled: !!id && (options?.enabled ?? true),
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
