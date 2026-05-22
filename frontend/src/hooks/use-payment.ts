import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateOrderParams {
    userId: string;
    serviceType: 'vehicle' | 'house' | 'laundry' | 'marketplace';
    referenceId: string;
    amount: number;
}

interface VerifyPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const useCreatePaymentOrder = () => {
    return useMutation({
        mutationFn: async (data: CreateOrderParams) => {
            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to create order');
            return json;
        },
    });
};

export const useVerifyPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: VerifyPaymentParams) => {
            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Payment verification failed');
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
            queryClient.invalidateQueries({ queryKey: ['vendorBookings'] });
        },
    });
};
