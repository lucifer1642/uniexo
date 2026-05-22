import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/auth.store';

export const useLivePulse = () => {
    const { token } = useAuthStore();
    return useQuery({
        queryKey: ['livePulse'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/live-pulse', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || {};
        },
        refetchInterval: 10000, // every 10s
    });
};

export const usePredictiveMetrics = () => {
    const { token } = useAuthStore();
    return useQuery({
        queryKey: ['predictiveMetrics'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/predictive', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || { topLtv: [], churnRisk: [] };
        },
    });
};

export const useVendorInsights = (vendorId: string) => {
    const { token } = useAuthStore();
    return useQuery({
        queryKey: ['vendorInsights', vendorId],
        queryFn: async () => {
            if (!vendorId) return null;
            const res = await fetch(`/api/intelligence/vendor/insights?vendorId=${vendorId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data;
        },
        enabled: !!vendorId,
    });
};

export const useHeartbeat = () => {
    return useMutation({
        mutationFn: async (data: {
            userId?: string;
            campus?: string;
            currentPage: string;
            sessionId: string;
            lat?: number;
            lng?: number;
        }) => {
            const res = await fetch('/api/intelligence/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return res.json();
        },
    });
};

export const usePlatformKpis = () => {
    const { token } = useAuthStore();
    return useQuery({
        queryKey: ['platformKpis'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/kpis', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || {};
        },
    });
};

export const useSettlements = () => {
    const { token } = useAuthStore();
    return useQuery({
        queryKey: ['settlements'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/settlements', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const json = await res.json();
            return json.data || [];
        },
    });
};

export const useComputeSnapshot = () => {
    const { token } = useAuthStore();
    return useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/intelligence/admin/snapshot', {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            return res.json();
        },
    });
};

