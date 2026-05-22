'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

export function AddMarketplaceItemDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: 'good',
    location: '',
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/marketplace', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      setOpen(false);
      setFormData({
        title: '', description: '', category: '', price: '', condition: 'good', location: ''
      });
      setFiles(null);
    },
    onError: (err: any) => {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to list item');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value);
    });

    if (files) {
      Array.from(files).forEach((file) => {
        fd.append('images', file);
      });
    }

    mutation.mutate(fd);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Sell Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List an Item for Sell</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. MacBook Pro M2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" required value={formData.category} onChange={handleChange} placeholder="e.g. Electronics" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" step="0.01" required value={formData.price} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select 
                id="condition" 
                name="condition" 
                required 
                value={formData.condition} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (City)</Label>
              <Input id="location" name="location" required value={formData.location} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images</Label>
            <Input id="images" name="images" type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
          </div>

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <Button type="submit" disabled={mutation.isPending} className="w-full mt-4">
            {mutation.isPending ? 'Listing...' : 'List Item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
