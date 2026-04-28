import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateBookingParams {
    serviceType: 'vehicle' | 'house';
    serviceId: string;
    startDate: string;
    endDate: string;
    notes?: string;
    bookingType?: 'hourly' | 'daily';
    paymentMethod?: 'online';
}

export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBookingParams) => {
            const res = await api.post('/bookings', data);
            return res.data;
        },
        onSuccess: () => {
            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
        },
    });
};

interface UpdateBookingStatusParams {
    bookingId: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    cancellationReason?: string;
}

export const useUpdateBookingStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingId, ...data }: UpdateBookingStatusParams) => {
            const res = await api.patch(`/bookings/${bookingId}/status`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendorBookings'] });
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
    });
};
