import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const REALTIME_INTERVAL = 3000;
const REALTIME_STALE = 2000;

export interface Vehicle {
    _id: string;
    vendorId: any;
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
    approvalStatus: string;
    isAvailable: boolean;
    createdAt: string;
}

export const useDeleteVehicle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/vehicles/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['vendorVehicles'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });
};

export const useVehicles = (filters: any = {}) => {
    return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
            const { data } = await api.get('/vehicles', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as Vehicle[];
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
