'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

export function AddLaundryServiceDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    providerName: '',
    providerPhone: '',
    providerAddress: '',
  });

  const [services, setServices] = useState([{ name: 'Standard Wash', price: '10', unit: 'load' }]);

  const [files, setFiles] = useState<FileList | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // The validator expects JSON with nested objects instead of FormData for Laundry based on the routes and schemas unless it accepts images. 
      // The typical way if no image array is defined is JSON. 
      // Let's check if the backend route uses 'upload.single()'. Wait, laundry.routes.ts says 'upload.single('images')' or none. 
      // Let's send it as JSON to be safe with the services array.
      const res = await api.post('/laundry/services', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laundryServices'] });
      setOpen(false);
      setFormData({
        name: '', description: '', providerName: '', providerPhone: '', providerAddress: ''
      });
      setServices([{ name: 'Standard Wash', price: '10', unit: 'load' }]);
      setFiles(null);
    },
    onError: (err: any) => {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to add service');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Send JSON because of nested services array
    const payload = {
      ...formData,
      services: services.map(s => ({
        name: s.name,
        price: Number(s.price),
        unit: s.unit
      }))
    };

    // If API actually requires FormData, we might need a different approach, but according to zod schema array of objects is expected.
    mutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
      const updated = [...services];
      updated[index] = { ...updated[index], [field]: value };
      setServices(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Service</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Laundry Service</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Package Name</Label>
            <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Premium Dry Cleaning" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input id="providerName" name="providerName" required value={formData.providerName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerPhone">Provider Phone</Label>
              <Input id="providerPhone" name="providerPhone" required value={formData.providerPhone} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="providerAddress">Provider Address</Label>
            <Input id="providerAddress" name="providerAddress" required value={formData.providerAddress} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                 <Label>Included Services Pricing</Label>
                 <Button type="button" variant="outline" size="sm" onClick={() => setServices([...services, {name: '', price: '', unit: 'kg'}])}>
                    + Add Item
                 </Button>
              </div>
              {services.map((srv, i) => (
                  <div key={i} className="flex gap-2">
                      <Input placeholder="Service name" required value={srv.name} onChange={(e) => handleServiceChange(i, 'name', e.target.value)} />
                      <Input placeholder="Price" type="number" required value={srv.price} onChange={(e) => handleServiceChange(i, 'price', e.target.value)} className="w-24" />
                      <Input placeholder="Unit" required value={srv.unit} onChange={(e) => handleServiceChange(i, 'unit', e.target.value)} className="w-24" />
                      {services.length > 1 && (
                          <Button type="button" variant="ghost" onClick={() => setServices(services.filter((_, idx) => idx !== i))}>X</Button>
                      )}
                  </div>
              ))}
          </div>

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <Button type="submit" disabled={mutation.isPending} className="w-full mt-4">
            {mutation.isPending ? 'Adding...' : 'Add Service'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
