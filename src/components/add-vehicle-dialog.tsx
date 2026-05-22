'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from 'sonner';

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const { user, token } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    year: '',
    registrationNumber: '',
    fuelType: '',
    seatingCapacity: '',
    pricePerHour: '',
    pricePerDay: '',
    location: '',
    description: '',
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const mutation = useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to add vehicle');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setOpen(false);
      toast.success('Vehicle added successfully!');
      
      setFormData({
        name: '', type: '', brand: '', model: '', year: '',
        registrationNumber: '', fuelType: '', seatingCapacity: '', pricePerHour: '', pricePerDay: '', location: '', description: ''
      });
      setFiles(null);
    },
    onError: (err: any) => {
      console.error('Vehicle upload failure:', err);
      setError(err.message || 'Failed to add vehicle');
      toast.error(err.message || 'Failed to add vehicle');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!files || files.length === 0) {
      setError('Please upload at least one vehicle image.');
      return;
    }

    const fd = new FormData();
    // Vendor ID from auth store
    fd.append('vendorId', user?.id || '');
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value);
    });

    Array.from(files).forEach((file) => {
      fd.append('images', file);
    });

    mutation.mutate(fd);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Vehicle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Vehicle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" required value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="" disabled>Select type</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Vehicle Name</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Luxury Sedan 2024" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" required value={formData.brand} onChange={handleChange} placeholder="e.g. BMW" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" required value={formData.model} onChange={handleChange} placeholder="e.g. X5" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" name="year" required type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.year} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <select id="fuelType" name="fuelType" required value={formData.fuelType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Any">Any</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seatingCapacity">Seats</Label>
                <Input id="seatingCapacity" name="seatingCapacity" required type="number" min="1" value={formData.seatingCapacity} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour (₹)</Label>
                <Input id="pricePerHour" name="pricePerHour" type="number" step="0.01" value={formData.pricePerHour} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Price Per Day (₹)</Label>
                <Input id="pricePerDay" name="pricePerDay" type="number" step="0.01" required value={formData.pricePerDay} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Vehicle Number Plate</Label>
              <Input id="registrationNumber" name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} placeholder="e.g. UP32XX1234" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (City)</Label>
              <Input id="location" name="location" required value={formData.location} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required value={formData.description} onChange={handleChange} placeholder="Detailed description of the vehicle" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Vehicle Image</Label>
            <Input id="images" name="images" required type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
          </div>

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <Button type="submit" disabled={mutation.isPending} className="w-full mt-4">
            {mutation.isPending ? 'Adding...' : 'Add Vehicle'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
