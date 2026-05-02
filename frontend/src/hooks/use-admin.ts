import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
    DashboardData,
    PaginatedResponse,
    User,
    VendorProfile,
    Booking,
    Payment,
    Transaction,
    MarketplaceItem,
    AdminSetting,
} from '@/types';

// ==================== Dashboard ====================

export function useAdminDashboard() {
    return useQuery<DashboardData>({
        queryKey: ['admin', 'dashboard'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard');
            return res.data.data;
        },
    });
}

// ==================== Users ====================

export function useAdminUsers(page = 1, limit = 20, role?: string, search?: string) {
    return useQuery<PaginatedResponse<User>>({
        queryKey: ['admin', 'users', page, limit, role, search],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit };
            if (role && role !== 'all') params.role = role;
            if (search) params.search = search;
            const res = await api.get('/admin/users', { params });
            return res.data.data;
        },
    });
}

export function useSuspendUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
            const res = await api.patch(`/admin/users/${userId}/suspend`, { suspended });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        },
    });
}

// ==================== Vendors ====================

export function useVendorsList() {
    return useQuery<PaginatedResponse<VendorProfile>>({
        queryKey: ['admin', 'vendors'],
        queryFn: async () => {
            const res = await api.get('/vendors', { params: { limit: 100 } });
            return res.data.data;
        },
    });
}

export function useApproveVendor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            vendorId,
            status,
            reason,
        }: {
            vendorId: string;
            status: 'approved' | 'rejected';
            reason?: string;
        }) => {
            const res = await api.patch(`/vendors/${vendorId}/approval`, { status, reason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        },
    });
}

// ==================== Bookings ====================

export function useAdminBookings(page = 1, limit = 20, status?: string) {
    return useQuery<PaginatedResponse<Booking>>({
        queryKey: ['admin', 'bookings', page, limit, status],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit };
            if (status && status !== 'all') params.status = status;
            const res = await api.get('/bookings', { params });
            return res.data.data;
        },
    });
}

// ==================== Payments ====================

export function useAdminPayments(page = 1, limit = 20) {
    return useQuery<PaginatedResponse<Payment>>({
        queryKey: ['admin', 'payments', page, limit],
        queryFn: async () => {
            const res = await api.get('/payments', { params: { page, limit } });
            return res.data.data;
        },
    });
}

// ==================== Transactions ====================

export function useAdminTransactions(page = 1, limit = 20) {
    return useQuery<PaginatedResponse<Transaction>>({
        queryKey: ['admin', 'transactions', page, limit],
        queryFn: async () => {
            const res = await api.get('/admin/transactions', { params: { page, limit } });
            return res.data.data;
        },
    });
}

// ==================== Reported Items ====================

export function useAdminReportedItems(page = 1, limit = 10) {
    return useQuery<PaginatedResponse<MarketplaceItem>>({
        queryKey: ['admin', 'reports', page, limit],
        queryFn: async () => {
            const res = await api.get('/admin/reports', { params: { page, limit } });
            return res.data.data;
        },
    });
}

export function useRemoveReportedItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: string) => {
            const res = await api.delete(`/admin/reports/${itemId}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        },
    });
}

// ==================== Settings ====================

export function useAdminSettings() {
    return useQuery<AdminSetting[]>({
        queryKey: ['admin', 'settings'],
        queryFn: async () => {
            const res = await api.get('/admin/settings');
            return res.data.data;
        },
    });
}

export function useUpdateSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            key,
            value,
            description,
        }: {
            key: string;
            value: unknown;
            description?: string;
        }) => {
            const res = await api.post('/admin/settings', { key, value, description });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
        },
    });
}

export function useSetCommission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (percent: number) => {
            const res = await api.post('/admin/commission', { percent });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        },
    });
}

// ==================== Rank Optimization ====================

export function useVendorsByCategory(category: string) {
    return useQuery<VendorProfile[]>({
        queryKey: ['admin', 'rank', category],
        queryFn: async () => {
            const res = await api.get(`/admin/rank/${category}`);
            return res.data.data;
        },
        enabled: !!category,
    });
}

export function useUpdateVendorRank() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ vendorProfileId, rank }: { vendorProfileId: string; rank: number }) => {
            const res = await api.patch(`/admin/rank/${vendorProfileId}`, { rank });
            return res.data;
        },
        onSuccess: () => {
            // Invalidate ALL listing caches for immediate visibility sync
            queryClient.invalidateQueries({ queryKey: ['admin', 'rank'] });
            queryClient.invalidateQueries({ queryKey: ['houses'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['laundryServices'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
        },
    });
}
