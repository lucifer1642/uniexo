import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/auth.store';

export function useMyBookings() {
    const { user, token } = useAuthStore();
    return useQuery({
        queryKey: ['bookings', 'my', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await fetch(`/api/bookings`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || [];
        },
        enabled: !!user?.id,
    });
}

export function useVendorBookings() {
    const { user, token } = useAuthStore();
    return useQuery({
        queryKey: ['bookings', 'vendor', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await fetch(`/api/bookings/vendor`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || [];
        },
        enabled: !!user?.id && user?.role === 'vendor',
    });
}
