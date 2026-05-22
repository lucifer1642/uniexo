import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMyOffers(type: 'buyer' | 'seller') {
    return useQuery({
        queryKey: ['offers', type],
        queryFn: async () => {
            const res = await api.get(`/marketplace/offers/${type}`);
            return res.data;
        },
    });
}

export function useCreateOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { itemId: string; offeredPrice: number; message?: string }) => {
            const res = await api.post('/marketplace/offers', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers', 'buyer'] });
        },
    });
}

export function useUpdateOfferStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
            const res = await api.patch(`/marketplace/offers/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers', 'seller'] });
        },
    });
}
