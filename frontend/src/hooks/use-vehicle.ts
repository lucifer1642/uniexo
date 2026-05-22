import { useQuery } from '@tanstack/react-query';
import { Vehicle } from './use-vehicles';

function mapVehicle(v: any): Vehicle {
  return {
    ...v,
    _id: v.id,
    vendorId: v.vendor || { name: 'Vendor', _id: v.vendor_id },
    modelName: v.model,
    registrationNumber: v.registration_number,
    fuelType: v.fuel_type,
    seatingCapacity: v.seating_capacity,
    pricePerHour: v.price_per_hour,
    pricePerDay: v.price_per_day,
    approvalStatus: v.approval_status,
    isAvailable: v.is_available,
    createdAt: v.created_at,
  };
}

export const useVehicle = (id: string, options?: { enabled?: boolean }) => {
    return useQuery<Vehicle>({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const res = await fetch(`/api/vehicles/${id}`);
            const json = await res.json();
            if (!json.success || !json.data) throw new Error(json.error || 'Vehicle not found');
            return mapVehicle(json.data);
        },
        enabled: !!id && (options?.enabled ?? true),
    });
};
