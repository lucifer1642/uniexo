import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/modules/auth/auth.store';

export const useVehicleFleet = () => {
    return useQuery({
        queryKey: ['vendorVehicleFleet'],
        queryFn: async () => {
            const userStr = localStorage.getItem('uniexo_user');
            const vendorId = userStr ? JSON.parse(userStr).id : '';
            if (!vendorId) return [];

            const res = await fetch(`/api/vehicles/vendor/fleet?vendorId=${vendorId}`);
            const json = await res.json();
            return json.data || [];
        },
        refetchInterval: 3000, // Real-time 3s DB refresh
    });
};

export const useDispatchVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const userStr = localStorage.getItem('uniexo_user');
            const vendorId = userStr ? JSON.parse(userStr).id : '';

            const res = await fetch(`/api/vehicles/${id}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, vendorId }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to dispatch vehicle');
            return json;
        },
        onSuccess: () => {
            toast.success('Vehicle dispatched successfully');
            queryClient.invalidateQueries({ queryKey: ['vendorVehicleFleet'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to dispatch vehicle');
        },
    });
};

export const useReturnVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const userStr = localStorage.getItem('uniexo_user');
            const vendorId = userStr ? JSON.parse(userStr).id : '';

            const res = await fetch(`/api/vehicles/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, vendorId }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to return vehicle');
            return json;
        },
        onSuccess: () => {
            toast.success('Vehicle returned successfully');
            queryClient.invalidateQueries({ queryKey: ['vendorVehicleFleet'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to return vehicle');
        },
    });
};

export const useToggleMaintenance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, isEntering }: { id: string; isEntering: boolean }) => {
            const userStr = localStorage.getItem('uniexo_user');
            const vendorId = userStr ? JSON.parse(userStr).id : '';

            const res = await fetch(`/api/vehicles/${id}/maintenance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEntering, vendorId }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to toggle maintenance');
            return json;
        },
        onSuccess: (_, variables) => {
            toast.success(variables.isEntering ? 'Vehicle sent to maintenance' : 'Vehicle back from maintenance');
            queryClient.invalidateQueries({ queryKey: ['vendorVehicleFleet'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update maintenance status');
        },
    });
};

export const useVehicleOperations = () => {
    return useQuery({
        queryKey: ['vendorVehicleOperations'],
        queryFn: async () => {
            const userStr = localStorage.getItem('uniexo_user');
            const vendorId = userStr ? JSON.parse(userStr).id : '';
            if (!vendorId) return [];

            const res = await fetch(`/api/vehicles/vendor/operations?vendorId=${vendorId}`);
            const json = await res.json();
            return json.data || [];
        },
        refetchInterval: 5000,
    });
};
