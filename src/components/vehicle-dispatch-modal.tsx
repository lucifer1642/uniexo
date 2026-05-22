import { useState } from 'react';
import { useDispatchVehicle } from '@/hooks/use-fleet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export function VehicleDispatchModal({ vehicle }: { vehicle: any }) {
    const [open, setOpen] = useState(false);
    const dispatchVehicle = useDispatchVehicle();

    const [dispatchedAt, setDispatchedAt] = useState('');
    const [expectedReturnAt, setExpectedReturnAt] = useState('');
    const [odometerOut, setOdometerOut] = useState('');
    const [dispatchNotes, setDispatchNotes] = useState('');

    const handleDispatch = (e: React.FormEvent) => {
        e.preventDefault();
        dispatchVehicle.mutate({
            id: vehicle._id,
            data: {
                dispatchedAt: dispatchedAt || new Date().toISOString(),
                expectedReturnAt: expectedReturnAt || undefined,
                odometerOut: odometerOut ? Number(odometerOut) : undefined,
                dispatchNotes,
                currentBookingId: vehicle.currentBooking?._id,
            }
        }, {
            onSuccess: () => {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Dispatch Vehicle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dispatch {vehicle.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDispatch} className="space-y-4 pt-4">
                    {vehicle.currentBooking && (
                        <div className="bg-muted p-3 rounded-md text-sm mb-4">
                            <p className="font-medium">Booking: {vehicle.currentBooking.userId?.name || 'Customer'}</p>
                            <p className="text-muted-foreground">Ends: {new Date(vehicle.currentBooking.endDate).toLocaleDateString()}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Dispatch Time</Label>
                        <Input 
                            type="datetime-local" 
                            value={dispatchedAt} 
                            onChange={e => setDispatchedAt(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground">Leave empty for current time</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Expected Return Time</Label>
                        <Input 
                            type="datetime-local" 
                            value={expectedReturnAt} 
                            onChange={e => setExpectedReturnAt(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Odometer Out</Label>
                        <Input 
                            type="number" 
                            placeholder="Current mileage" 
                            value={odometerOut} 
                            onChange={e => setOdometerOut(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input 
                            placeholder="Condition notes, fuel level, etc." 
                            value={dispatchNotes} 
                            onChange={e => setDispatchNotes(e.target.value)} 
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={dispatchVehicle.isPending}>
                        {dispatchVehicle.isPending ? 'Dispatching...' : 'Confirm Dispatch'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
