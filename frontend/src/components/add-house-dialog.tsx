'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

export function AddHouseDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '', // 'pg' | 'room'
    address: '',
    city: '',
    state: '',
    pincode: '',
    bedrooms: '1',
    bathrooms: '1',
    area: '100',
    pricePerMonth: '', // Legacy PG
    pricePerDay: '', // Room
    pricePerHour: '', // Room Hourly
    singleSharingPrice: '', // PG
    doubleSharingPrice: '', // PG
    tripleSharingPrice: '', // PG
    securityDeposit: '',
    lockinPeriod: '0 months',
    noticePeriod: '15 days',
    electricityIncluded: 'true',
    electricityCharge: '',
    locationUrl: '',
    tenantsStaying: '0',
  });

  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const [amenities, setAmenities] = useState({
    commonAmenities: '',
    roomAmenities: '',
    servicesAmenities: '',
    foodAmenities: '',
  });

  const [files, setFiles] = useState<FileList | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/houses', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      setOpen(false);
      setFormData({
        title: '', description: '', propertyType: '', address: '', city: '', state: '',
        pincode: '', bedrooms: '1', bathrooms: '1', area: '100', pricePerMonth: '', pricePerDay: '', pricePerHour: '',
        singleSharingPrice: '', doubleSharingPrice: '', tripleSharingPrice: '',
        securityDeposit: '', lockinPeriod: '0 months', noticePeriod: '15 days', electricityIncluded: 'true', electricityCharge: '',
        locationUrl: '', tenantsStaying: '0'
      });
      setAmenities({
        commonAmenities: '', roomAmenities: '', servicesAmenities: '', foodAmenities: ''
      });
      setFaqs([{ question: '', answer: '' }]);
      setFiles(null);
    },
    onError: (err: any) => {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to add property');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!files || files.length === 0) {
      setError('Please upload at least one image of the room/property.');
      return;
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // conditionally skip irrelevant fields
      if (formData.propertyType === 'room' && ['pricePerMonth', 'singleSharingPrice', 'doubleSharingPrice', 'tripleSharingPrice', 'securityDeposit', 'electricityIncluded', 'electricityCharge'].includes(key)) return;
      if (formData.propertyType === 'pg' && ['pricePerDay', 'pricePerHour'].includes(key)) return;
      
      fd.append(key, value);
    });

    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    validFaqs.forEach((faq, index) => {
      fd.append(`faqs[${index}][question]`, faq.question);
      fd.append(`faqs[${index}][answer]`, faq.answer);
    });

    // Append array fields splitting by comma
    Object.entries(amenities).forEach(([key, value]) => {
      if (value.trim()) {
        const arr = value.split(',').map(s => s.trim()).filter(Boolean);
        arr.forEach(item => fd.append(`${key}[]`, item)); // backend needs array notation or just multiple appends if using body raw, but multer+zod handles multiple values if we append same key
      }
    });

    Array.from(files).forEach((file) => {
      fd.append('images', file);
    });

    mutation.mutate(fd);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmenities({ ...amenities, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Property</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List a New Property</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4 pb-4">
          <div className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-slate-800">Basic Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Property / PG Name</Label>
                  <Input id="title" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Sunrise PG or Luxury Room" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Listing Type</Label>
                  <select id="propertyType" name="propertyType" required value={formData.propertyType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="" disabled>Select Type</option>
                    <option value="pg">PG (Per Month / Sharing)</option>
                    <option value="room">Room (Per Day)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-slate-800">Pricing & Terms</h3>
              {formData.propertyType === 'pg' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="singleSharingPrice">Single Sharing Rate (₹)</Label>
                    <Input id="singleSharingPrice" name="singleSharingPrice" type="number" step="0.01" min="0" value={formData.singleSharingPrice} onChange={handleChange} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doubleSharingPrice">Double Sharing Rate (₹)</Label>
                    <Input id="doubleSharingPrice" name="doubleSharingPrice" type="number" step="0.01" min="0" value={formData.doubleSharingPrice} onChange={handleChange} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tripleSharingPrice">Triple Sharing Rate (₹)</Label>
                    <Input id="tripleSharingPrice" name="tripleSharingPrice" type="number" step="0.01" min="0" value={formData.tripleSharingPrice} onChange={handleChange} placeholder="Optional" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pricePerMonth">Base/Default Rent (₹/mo)</Label>
                    <Input id="pricePerMonth" name="pricePerMonth" type="number" step="0.01" required min="0" value={formData.pricePerMonth} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="securityDeposit">Security Deposit (₹)</Label>
                    <Input id="securityDeposit" name="securityDeposit" type="number" step="0.01" required min="0" value={formData.securityDeposit} onChange={handleChange} />
                  </div>
                  
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="electricityIncluded">Electricity Included?</Label>
                    <select id="electricityIncluded" name="electricityIncluded" required value={formData.electricityIncluded} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="true">Yes, included in rent</option>
                      <option value="false">No, charged separately</option>
                    </select>
                  </div>
                  {formData.electricityIncluded === 'false' && (
                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="electricityCharge">Expected Electricity Charge (₹)</Label>
                      <Input id="electricityCharge" name="electricityCharge" type="number" step="0.01" required min="0" value={formData.electricityCharge} onChange={handleChange} />
                    </div>
                  )}
                </div>
              )}

              {formData.propertyType === 'room' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerDay">Price Per Day (₹)</Label>
                    <Input id="pricePerDay" name="pricePerDay" type="number" step="0.01" required min="0" value={formData.pricePerDay} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerHour">Price Per Hour (₹)</Label>
                    <Input id="pricePerHour" name="pricePerHour" type="number" step="0.01" min="0" value={formData.pricePerHour} onChange={handleChange} placeholder="Optional" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="lockinPeriod">Lock-in Period</Label>
                  <Input id="lockinPeriod" name="lockinPeriod" value={formData.lockinPeriod} onChange={handleChange} placeholder="e.g. 0 months, 6 months" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod">Notice Period</Label>
                  <Input id="noticePeriod" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} placeholder="e.g. 15 days, 30 days" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantsStaying">Tenants Currently Staying</Label>
                  <Input id="tenantsStaying" name="tenantsStaying" type="number" min="0" value={formData.tenantsStaying} onChange={handleChange} placeholder="e.g. 10" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-slate-800">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address & Location</Label>
                  <Input id="address" name="address" required value={formData.address} onChange={handleChange} placeholder="Full address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" required value={formData.city} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" required value={formData.state} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" required value={formData.pincode} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationUrl">Google Maps Embed URL</Label>
                  <Input id="locationUrl" name="locationUrl" value={formData.locationUrl} onChange={handleChange} placeholder="e.g. https://www.google.com/maps/embed?pb=..." />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-slate-800">Description & Amenities</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Property Description</Label>
                <Textarea id="description" name="description" required value={formData.description} onChange={handleChange} placeholder="Describe the property..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="commonAmenities" className="text-xs text-muted-foreground">Common Amenities (comma-separated)</Label>
                  <Input id="commonAmenities" name="commonAmenities" value={amenities.commonAmenities} onChange={handleAmenitiesChange} placeholder="e.g. Common Laundry, Lounge Area" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomAmenities" className="text-xs text-muted-foreground">Room Amenities (comma-separated)</Label>
                  <Input id="roomAmenities" name="roomAmenities" value={amenities.roomAmenities} onChange={handleAmenitiesChange} placeholder="e.g. AC, Wardrobe, Study Table" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servicesAmenities" className="text-xs text-muted-foreground">Services (comma-separated)</Label>
                  <Input id="servicesAmenities" name="servicesAmenities" value={amenities.servicesAmenities} onChange={handleAmenitiesChange} placeholder="e.g. Daily Housekeeping, Wi-Fi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foodAmenities" className="text-xs text-muted-foreground">Food (comma-separated)</Label>
                  <Input id="foodAmenities" name="foodAmenities" value={amenities.foodAmenities} onChange={handleAmenitiesChange} placeholder="e.g. Breakfast, Dinner, Tea Machine" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-800">FAQs</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>Add FAQ</Button>
              </div>
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-2 border-b pb-4 mb-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-semibold">Q{index + 1}</Label>
                    {faqs.length > 1 && (
                      <button type="button" className="text-red-500 text-xs" onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}>Remove</button>
                    )}
                  </div>
                  <Input 
                    placeholder="Question" 
                    value={faq.question} 
                    onChange={e => {
                      const newFaqs = [...faqs];
                      newFaqs[index].question = e.target.value;
                      setFaqs(newFaqs);
                    }} 
                  />
                  <Textarea 
                    placeholder="Answer" 
                    value={faq.answer} 
                    onChange={e => {
                      const newFaqs = [...faqs];
                      newFaqs[index].answer = e.target.value;
                      setFaqs(newFaqs);
                    }} 
                  />
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">              <h3 className="font-semibold text-sm text-slate-800">Media</h3>
              <div className="space-y-2">
                <Label htmlFor="images">Images of Room/Property (Upload Multiple)</Label>
                <Input id="images" name="images" type="file" required multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
              </div>
            </div>

          </div>

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <Button type="submit" disabled={mutation.isPending} className="w-full mt-6 h-12 text-lg">
            {mutation.isPending ? 'Adding Property...' : 'List Property'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
