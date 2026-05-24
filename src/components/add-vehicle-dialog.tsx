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
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      queryClient.invalidateQueries({ queryKey: ['vendorVehicles'] });
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
            
            {/* SaaS Preset Booster: Click & Go */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse fill-amber-500" />
                  SaaS Preset Booster: Click & Go!
                </h4>
                <Badge variant="outline" className="text-[9px] bg-blue-100/50 text-blue-800 border-blue-200 font-bold">Pre-filled Data</Badge>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Select a template to instantly fill all details. Click, upload images, and go!</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white border-blue-200 hover:bg-blue-100/30 text-xs font-bold text-slate-800 justify-start h-10 px-3 rounded-lg"
                  onClick={() => {
                    setFormData({
                      name: "Honda Activa 6G 2024",
                      type: "bike",
                      brand: "Honda",
                      model: "Activa 6G",
                      year: "2024",
                      registrationNumber: "DL3SBX9901",
                      fuelType: "Petrol",
                      seatingCapacity: "2",
                      pricePerHour: "40",
                      pricePerDay: "450",
                      location: "New Delhi",
                      description: "Premium well-maintained Honda Activa scooter with pristine fuel economy, dual helmet locks, front storage, mobile holder, and USB charging built-in. Perfect for campus commuting.",
                    });
                    toast.success("Honda Activa Template loaded!");
                  }}
                >
                  🛵 Scooter Preset
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white border-blue-200 hover:bg-blue-100/30 text-xs font-bold text-slate-800 justify-start h-10 px-3 rounded-lg"
                  onClick={() => {
                    setFormData({
                      name: "Royal Enfield Classic 350",
                      type: "bike",
                      brand: "Royal Enfield",
                      model: "Classic 350",
                      year: "2023",
                      registrationNumber: "UP32MN8890",
                      fuelType: "Petrol",
                      seatingCapacity: "2",
                      pricePerHour: "90",
                      pricePerDay: "950",
                      location: "Noida",
                      description: "High-performance Royal Enfield Classic cruiser bike in signature Gunmetal Grey. Custom seats for touring, crash guards installed, pristine chrome engine, smooth performance.",
                    });
                    toast.success("Classic 350 Template loaded!");
                  }}
                >
                  🏍️ Cruiser Bike Preset
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white border-blue-200 hover:bg-blue-100/30 text-xs font-bold text-slate-800 justify-start h-10 px-3 rounded-lg"
                  onClick={() => {
                    setFormData({
                      name: "Maruti Swift VXI 2024",
                      type: "car",
                      brand: "Maruti Suzuki",
                      model: "Swift VXI",
                      year: "2024",
                      registrationNumber: "HR26BC4412",
                      fuelType: "Petrol",
                      seatingCapacity: "5",
                      pricePerHour: "150",
                      pricePerDay: "1800",
                      location: "Gurugram",
                      description: "Compact, high-efficiency Maruti Swift car with excellent fuel performance, cooling AC, touch entertainment system with Bluetooth, reverse cameras, dual airbags. Best for city trips.",
                    });
                    toast.success("Maruti Swift Template loaded!");
                  }}
                >
                  🚘 Compact Car Preset
                </Button>
              </div>
            </div>

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
