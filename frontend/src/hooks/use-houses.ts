import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { House } from '@/types';

const REALTIME_INTERVAL = 3000;
const REALTIME_STALE = 2000;

export const useHouses = (filters: any = {}) => {
    return useQuery({
        queryKey: ['houses', filters],
        queryFn: async () => {
            const { data } = await api.get('/houses', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as House[];
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useHouse = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['house', id],
        queryFn: async () => {
            const { data } = await api.get(`/houses/${id}`);
            return data.data as House;
        },
        enabled: !!id && (options?.enabled ?? true),
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
