import { useQuery, useMutation } from '@tanstack/react-query';

export const useLivePulse = () => {
    return useQuery({
        queryKey: ['livePulse'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/live-pulse');
            const json = await res.json();
            return json.data || {};
        },
        refetchInterval: 10000, // every 10s
    });
};

export const usePredictiveMetrics = () => {
    return useQuery({
        queryKey: ['predictiveMetrics'],
        queryFn: async () => {
            const res = await fetch('/api/intelligence/admin/predictive');
            const json = await res.json();
            return json.data || { topLtv: [], churnRisk: [] };
        },
    });
};

export const useVendorInsights = (vendorId: string) => {
    return useQuery({
        queryKey: ['vendorInsights', vendorId],
        queryFn: async () => {
            if (!vendorId) return null;
            const res = await fetch(`/api/intelligence/vendor/insights?vendorId=${vendorId}`);
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
