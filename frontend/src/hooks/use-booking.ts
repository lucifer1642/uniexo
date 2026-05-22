import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateBookingParams {
    userId: string;
    serviceType: 'vehicle' | 'house';
    serviceId: string;
    startDate: string;
    endDate: string;
    notes?: string;
    bookingType?: 'hourly' | 'daily';
    paymentMethod?: 'online';
    securityDeposit?: number;
    monthlyRent?: number;
    totalMonths?: number;
}

export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBookingParams) => {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Booking failed');
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
        },
    });
};

interface UpdateBookingStatusParams {
    bookingId: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    userId?: string;
    vendorId?: string;
}

export const useUpdateBookingStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingId, ...data }: UpdateBookingStatusParams) => {
            const res = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Update failed');
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendorBookings'] });
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
        },
    });
};
