import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const useVehicleFleet = () => {
    return useQuery({
        queryKey: ['vendorVehicleFleet'],
        queryFn: async () => {
            const { data } = await api.get('/vehicles/vendor/fleet');
            return data.data;
        },
        refetchInterval: 3000, // Real-time 3s DB refresh
    });
};

export const useDispatchVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.post(`/vehicles/${id}/dispatch`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Vehicle dispatched successfully');
            queryClient.invalidateQueries({ queryKey: ['vendorVehicleFleet'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to dispatch vehicle');
        },
    });
};

export const useReturnVehicle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.post(`/vehicles/${id}/return`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Vehicle returned successfully');
            queryClient.invalidateQueries({ queryKey: ['vendorVehicleFleet'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to return vehicle');
        },
    });
};
