import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const REALTIME_INTERVAL = 3000;
const REALTIME_STALE = 2000;

export interface MarketplaceItem {
    _id: string;
    sellerId: any;
    title: string;
    description: string;
    category: string;
    price: number;
    condition: string;
    images: string[];
    location: string;
    isSold: boolean;
    createdAt: string;
}

export const useMarketplaceItems = (filters: any = {}) => {
    return useQuery({
        queryKey: ['marketplaceItems', filters],
        queryFn: async () => {
            const { data } = await api.get('/marketplace', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as MarketplaceItem[];
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useMarketplaceItem = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['marketplaceItem', id],
        queryFn: async () => {
            const { data } = await api.get(`/marketplace/${id}`);
            return data.data as MarketplaceItem;
        },
        enabled: !!id && (options?.enabled ?? true),
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
