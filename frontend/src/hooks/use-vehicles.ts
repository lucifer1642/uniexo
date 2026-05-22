import { useQuery } from '@tanstack/react-query';

export interface Vehicle {
    id: string;
    _id: string; // compatibility alias
    vendor_id: string;
    vendorId: any; // compatibility alias  
    name: string;
    type: string;
    brand: string;
    modelName: string;
    model: string;
    year: number;
    registrationNumber: string;
    registration_number: string;
    fuelType: string;
    fuel_type: string;
    seatingCapacity: number;
    seating_capacity: number;
    pricePerHour?: number;
    price_per_hour?: number;
    pricePerDay: number;
    price_per_day: number;
    images: string[];
    description?: string;
    features: string[];
    location: string;
    approvalStatus: string;
    approval_status: string;
    isAvailable: boolean;
    is_available: boolean;
    createdAt: string;
    created_at: string;
    vendor?: { id: string; name: string; email: string; phone?: string };
}

function mapVehicle(v: any): Vehicle {
  return {
    ...v,
    _id: v.id,
    vendorId: v.vendor || { name: 'Vendor', _id: v.vendor_id },
    modelName: v.model,
    registrationNumber: v.registration_number,
    fuelType: v.fuel_type,
    seatingCapacity: v.seating_capacity,
    pricePerHour: v.price_per_hour,
    pricePerDay: v.price_per_day,
    approvalStatus: v.approval_status,
    isAvailable: v.is_available,
    createdAt: v.created_at,
  };
}

export const useDeleteVehicle = () => {
    const { useQueryClient, useMutation } = require('@tanstack/react-query');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const userId = JSON.parse(localStorage.getItem('uniexo_user') || '{}')?.id;
            const res = await fetch(`/api/vehicles/${id}?vendorId=${userId}`, { method: 'DELETE' });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
    });
};

export const useVehicles = (filters: any = {}) => {
    return useQuery<Vehicle[]>({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.type) params.set('type', filters.type);
            const res = await fetch(`/api/vehicles?${params.toString()}`);
            const json = await res.json();
            if (!json.success) return [];
            return (json.data || []).map(mapVehicle);
        },
        refetchInterval: 5000,
        staleTime: 3000,
    });
};
