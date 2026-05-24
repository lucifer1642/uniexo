import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtimeSync } from './use-realtime';

const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem('uniexo-auth-storage');
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
        return {};
    }
};

export const useDashboardRealtime = (role: 'user' | 'vendor' | 'admin') => {
    const tables: any[] = ['bookings', 'wallets'];
    const keys = [
        ['wallet'], 
        ['walletTransactions'],
        ['vendorDashboardStats'],
        ['vendorAnalyticsOverview']
    ];

    if (role === 'vendor') {
        tables.push('vehicles', 'houses', 'laundry_orders');
        keys.push(['vendorBookings'], ['vendorVehicles'], ['vendorHouses']);
    } else {
        keys.push(['userBookings'], ['userLaundryOrders'], ['userMarketplaceItems']);
    }

    return useRealtimeSync(tables, keys);
};

const REALTIME_INTERVAL = 60000; // 60 seconds (Fallback polling)
const REALTIME_STALE = 30000;    // 30 seconds

// User bookings
export const useUserBookings = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userBookings', page, limit],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/bookings?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                const json = await res.json();
                if (!json.success) return { bookings: [], pagination: null };
                const bookings = (json.data || []).map((b: any) => ({ ...b, _id: b.id }));
                return { bookings, pagination: json.pagination || null };
            } catch { return { bookings: [], pagination: null }; }
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
            try {
                const res = await fetch(`/api/bookings/vendor?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                const json = await res.json();
                if (!json.success) return { bookings: [], pagination: null };
                const bookings = (json.data || []).map((b: any) => ({ ...b, _id: b.id }));
                return { bookings, pagination: json.pagination || null };
            } catch { return { bookings: [], pagination: null }; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Wallet (stub - returns empty until wallet API is built)
export const useWallet = () => {
    return useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            try {
                const res = await fetch('/api/wallet', { headers: getAuthHeaders() });
                if (!res.ok) return { balance: 0, transactions: [] };
                const json = await res.json();
                return json.data || { balance: 0, transactions: [] };
            } catch { return { balance: 0, transactions: [] }; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Wallet transactions (stub)
export const useWalletTransactions = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['walletTransactions', page, limit],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/wallet/transactions?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                if (!res.ok) return { transactions: [], pagination: null };
                const json = await res.json();
                return { transactions: json.data || [], pagination: json.pagination || null };
            } catch { return { transactions: [], pagination: null }; }
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
            const res = await fetch(`/api/vehicles/vendor/my-vehicles?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (!json.success) return { vehicles: [], pagination: null };
            
            const mapped = (json.data || []).map((v: any) => ({
                ...v,
                _id: v.id,
                pricePerDay: v.price_per_day,
                approvalStatus: v.approval_status,
                isAvailable: v.is_available,
            }));
            
            return { vehicles: mapped, pagination: json.pagination };
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
            const res = await fetch(`/api/houses/vendor/my-houses?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (!json.success) return { houses: [], pagination: null };
            
            const mapped = (json.data || []).map((h: any) => ({
                ...h,
                _id: h.id,
                pricePerMonth: h.price_per_month,
                pricePerDay: h.price_per_day,
                propertyType: h.property_type,
                singleSharingPrice: h.single_sharing_price,
                doubleSharingPrice: h.double_sharing_price,
                tripleSharingPrice: h.triple_sharing_price,
                securityDeposit: h.security_deposit,
                approvalStatus: h.approval_status,
                isAvailable: h.is_available,
            }));
            
            return { houses: mapped, pagination: json.pagination };
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
            try {
                const res = await fetch(`/api/laundry/orders?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                if (!res.ok) return { orders: [], pagination: null };
                const json = await res.json();
                return { orders: json.data || [], pagination: json.pagination || null };
            } catch { return { orders: [], pagination: null }; }
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
            try {
                const res = await fetch(`/api/marketplace/my-items?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                if (!res.ok) return { items: [], pagination: null };
                const json = await res.json();
                return { items: json.data || [], pagination: json.pagination || null };
            } catch { return { items: [], pagination: null }; }
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
            try {
                const res = await fetch(`/api/vendors/profile`, { headers: getAuthHeaders() });
                if (!res.ok) return null;
                const json = await res.json();
                return json.data || null;
            } catch { return null; }
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
            try {
                const res = await fetch(`/api/vendors/stats`, { headers: getAuthHeaders() });
                if (!res.ok) return {};
                const json = await res.json();
                return json.data || {};
            } catch { return {}; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// ─── ANALYTICS HOOKS ──────────────────────────

export const useVendorAnalyticsOverview = () => {
    return useQuery({
        queryKey: ['vendorAnalyticsOverview'],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/overview`, { headers: getAuthHeaders() });
                if (!res.ok) return {};
                const json = await res.json();
                return json.data || {};
            } catch { return {}; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorSalesBreakdown = (period: 'week' | 'month' | 'year' = 'month') => {
    return useQuery({
        queryKey: ['vendorSalesBreakdown', period],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/sales?period=${period}`, { headers: getAuthHeaders() });
                if (!res.ok) return null;
                const json = await res.json();
                return json.data || null;
            } catch { return null; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorLedger = (page = 1, limit = 20) => {
    return useQuery({
        queryKey: ['vendorLedger', page, limit],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/ledger?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                if (!res.ok) return null;
                const json = await res.json();
                return json.data || null;
            } catch { return null; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorDues = () => {
    return useQuery({
        queryKey: ['vendorDues'],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/dues`, { headers: getAuthHeaders() });
                if (!res.ok) return { totalDue: 0 };
                const json = await res.json();
                return json.data || { totalDue: 0 };
            } catch { return { totalDue: 0 }; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorBookingTrends = (days = 30) => {
    return useQuery({
        queryKey: ['vendorBookingTrends', days],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/trends?days=${days}`, { headers: getAuthHeaders() });
                if (!res.ok) return [];
                const json = await res.json();
                return json.data || [];
            } catch { return []; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorRevenueTimeSeries = (days = 30) => {
    return useQuery({
        queryKey: ['vendorRevenueTimeSeries', days],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/revenue-series?days=${days}`, { headers: getAuthHeaders() });
                if (!res.ok) return [];
                const json = await res.json();
                return json.data || [];
            } catch { return []; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

export const useVendorRoomOccupancy = () => {
    return useQuery({
        queryKey: ['vendorRoomOccupancy'],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/vendors/analytics/room-occupancy`, { headers: getAuthHeaders() });
                if (!res.ok) return [];
                const json = await res.json();
                return json.data || [];
            } catch { return []; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};

// Vendor payments received
export const useVendorPayments = (page = 1, limit = 20) => {
    return useQuery({
        queryKey: ['vendorPayments', page, limit],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/payments/vendor?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
                if (!res.ok) return { payments: [], total: 0 };
                const json = await res.json();
                return { payments: json.data || [], total: json.total || 0 };
            } catch { return { payments: [], total: 0 }; }
        },
        refetchInterval: REALTIME_INTERVAL,
        staleTime: REALTIME_STALE,
    });
};
