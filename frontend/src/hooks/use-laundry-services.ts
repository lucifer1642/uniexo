import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LaundryService {
    _id: string;
    vendorId?: string;
    name: string;
    description: string;
    providerName: string;
    providerPhone: string;
    providerAddress: string;
    services: {
        name: string;
        price: number;
        unit: string;
    }[];
    images: string[];
    rank: number;
    onsitePickup: boolean;
    onStoreService: boolean;
    onsitePickupCharge: number;
    isActive: boolean;
    createdAt: string;
}

export const useLaundryServices = (filters: any = {}) => {
    return useQuery({
        queryKey: ['laundryServices', filters],
        queryFn: async () => {
            const { data } = await api.get('/laundry/services', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as LaundryService[];
        },
        refetchInterval: 3000,
        staleTime: 2000,
    });
};

export const useLaundryService = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['laundryService', id],
        queryFn: async () => {
            const { data } = await api.get(`/laundry/services/${id}`);
            return data.data as LaundryService;
        },
        enabled: !!id && (options?.enabled ?? true),
        refetchInterval: 3000,
        staleTime: 2000,
    });
};

interface CreateLaundryOrderParams {
    laundryServiceId: string;
    items: { serviceName: string; quantity: number }[];
    deliveryAddress: string;
    pickupType?: 'onsite' | 'store';
    pickupDate?: string;
    notes?: string;
}

export const useCreateLaundryOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateLaundryOrderParams) => {
            const res = await api.post('/laundry/orders', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        },
    });
};

// Vendor: Get own laundry service
export const useVendorLaundryService = () => {
    return useQuery({
        queryKey: ['vendorLaundryService'],
        queryFn: async () => {
            const { data } = await api.get('/laundry/vendor/my-service');
            return data.data as LaundryService | null;
        },
    });
};

// Vendor: Update own laundry service toggles
export const useUpdateVendorLaundryService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            onsitePickup?: boolean;
            onStoreService?: boolean;
            onsitePickupCharge?: number;
        }) => {
            const res = await api.patch('/laundry/vendor/my-service', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendorLaundryService'] });
            queryClient.invalidateQueries({ queryKey: ['laundryServices'] });
        },
    });
};

// ─── VENDOR LAUNDRY ORDERS ──────────────────────────────────────────

export const useVendorLaundryOrders = (page = 1, limit = 20, status?: string) => {
    return useQuery({
        queryKey: ['vendorLaundryOrders', page, limit, status],
        queryFn: async () => {
            const params: any = { page, limit };
            if (status) params.status = status;
            const { data } = await api.get('/laundry/vendor/orders', { params });
            return data.data;
        },
        refetchInterval: 3000,
    });
};

export const useUpdateVendorOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.patch(`/laundry/vendor/orders/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendorLaundryOrders'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
        },
    });
};
