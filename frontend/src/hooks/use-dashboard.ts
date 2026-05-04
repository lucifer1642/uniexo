import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const REALTIME_INTERVAL = 8000; // 8 seconds
const REALTIME_STALE = 5000;    // 5 seconds

// User bookings
export const useUserBookings = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userBookings', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/bookings/my', { params: { page, limit } });
            const result = data.data;
            return { bookings: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor bookings
export const useVendorBookings = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorBookings', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/bookings/vendor', { params: { page, limit } });
            const result = data.data;
            return { bookings: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Wallet
export const useWallet = () => {
    return useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const { data } = await api.get('/wallet');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Wallet transactions
export const useWalletTransactions = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['walletTransactions', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/wallet/transactions', { params: { page, limit } });
            const result = data.data;
            return { transactions: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor vehicles
export const useVendorVehicles = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorVehicles', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/vehicles/vendor/my-vehicles', { params: { page, limit } });
            const result = data.data;
            return { vehicles: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor houses
export const useVendorHouses = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorHouses', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/houses/vendor/my-houses', { params: { page, limit } });
            const result = data.data;
            return { houses: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// User laundry orders
export const useUserLaundryOrders = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userLaundryOrders', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/laundry/orders/my', { params: { page, limit } });
            const result = data.data;
            return { orders: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// User marketplace items
export const useUserMarketplaceItems = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userMarketplaceItems', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/marketplace/user/my-items', { params: { page, limit } });
            const result = data.data;
            return { items: result?.data || result || [], pagination: result?.pagination };
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor profile
export const useVendorProfile = () => {
    return useQuery({
        queryKey: ['vendorProfile'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/profile');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor dashboard stats
export const useVendorDashboardStats = () => {
    return useQuery({
        queryKey: ['vendorDashboardStats'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/dashboard/stats');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// ─── ANALYTICS HOOKS ──────────────────────────────────────────────

export const useVendorAnalyticsOverview = () => {
    return useQuery({
        queryKey: ['vendorAnalyticsOverview'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/overview');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorSalesBreakdown = (period: 'week' | 'month' | 'year' = 'month') => {
    return useQuery({
        queryKey: ['vendorSalesBreakdown', period],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/sales', { params: { period } });
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorLedger = (page = 1, limit = 20) => {
    return useQuery({
        queryKey: ['vendorLedger', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/ledger', { params: { page, limit } });
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorDues = () => {
    return useQuery({
        queryKey: ['vendorDues'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/dues');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorBookingTrends = (days = 30) => {
    return useQuery({
        queryKey: ['vendorBookingTrends', days],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/trends', { params: { days } });
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorRevenueTimeSeries = (days = 30) => {
    return useQuery({
        queryKey: ['vendorRevenueTimeSeries', days],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/revenue-series', { params: { days } });
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorRoomOccupancy = () => {
    return useQuery({
        queryKey: ['vendorRoomOccupancy'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/analytics/room-occupancy');
            return data.data;
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
