'use client';

import { useAuthStore } from '@/store/auth.store';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LocateFixed } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    universityId: user?.universityId || '',
    businessName: '',
    serviceType: '',
    businessAddress: '',
    businessPhone: '',
    description: '',
  });

  const [lastSavedPhone, setLastSavedPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        universityId: user.universityId || '',
      }));
    }
  }, [user?.name, user?.email, user?.phone, user?.location, user?.universityId]);

  // Fetch live user profile on mount to overwrite any stale cached fields
  useEffect(() => {
    api.get('/users/profile')
      .then(res => updateUser(res.data.data))
      .catch(err => console.error('Failed to fetch live user profile', err));
  }, []);

  useEffect(() => {
    if (user?.role === 'vendor') {
      api.get('/vendors/profile').then(res => {
        const vendorData = res.data.data;
        setFormData(prev => ({
          ...prev,
          businessName: vendorData.businessName || '',
          serviceType: vendorData.serviceType || '',
          businessAddress: vendorData.businessAddress || '',
          businessPhone: vendorData.businessPhone || '',
          description: vendorData.description || '',
        }));
      }).catch(err => console.error('Failed to fetch vendor profile', err));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAutoSavePhone = async () => {
    if (formData.phone === lastSavedPhone) return;
    
    try {
      await api.patch('/users/profile', { phone: formData.phone });
      setLastSavedPhone(formData.phone);
      updateUser({ phone: formData.phone });
      toast.success('Phone number auto-saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-save phone number');
      setFormData(prev => ({ ...prev, phone: lastSavedPhone }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData: Record<string, string> = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.phone) updateData.phone = formData.phone;
      
      if (user?.role === 'user') {
        if (formData.universityId) updateData.universityId = formData.universityId;
        if (formData.location) updateData.location = formData.location;
      }

      // If vendor, update shared profile fields too
      if (user?.role === 'vendor') {
        if (formData.businessName) updateData.businessName = formData.businessName;
        if (formData.serviceType) updateData.serviceType = formData.serviceType;
      }
      
      const response = await api.patch('/users/profile', updateData);
      let updatedUser = response.data.data;

      if (user?.role === 'vendor') {
        const vendorUpdates: Record<string, string> = {};
        if (formData.businessName) vendorUpdates.businessName = formData.businessName;
        if (formData.businessAddress) vendorUpdates.businessAddress = formData.businessAddress;
        if (formData.businessPhone) vendorUpdates.businessPhone = formData.businessPhone;
        if (formData.description) vendorUpdates.description = formData.description;
        if (formData.serviceType) vendorUpdates.serviceType = formData.serviceType;
        
        if (Object.keys(vendorUpdates).length > 0) {
          const vRes = await api.patch('/vendors/profile', vendorUpdates);
          // Merge vendor data back if needed, but profiles are primary for AuthStore
        }
      }

      if (updatedUser) {
        updateUser(updatedUser);
        setLastSavedPhone(updatedUser.phone || '');
      }
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="col-span-1 border-border/50">
            <CardContent className="p-6 flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4 ring-2 ring-primary/10 relative">
                <AvatarImage src={avatarPreview || user?.avatar} className="object-cover" />
                <AvatarFallback className="text-4xl">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full text-white text-xs z-10">
                    Uploading...
                  </div>
                )}
              </Avatar>
              <h2 className="text-xl font-semibold mb-1">{user?.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">{user?.role}</p>
              <div className="w-full relative">
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setAvatarPreview(URL.createObjectURL(file));
                      setUploadingAvatar(true);
                      const uploadData = new FormData();
                      uploadData.append('avatar', file);
                      try {
                        const res = await api.post('/users/avatar', uploadData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        updateUser({ avatar: res.data.data.avatar });
                        toast.success('Avatar uploaded successfully');
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to upload avatar');
                        setAvatarPreview(null); // revert preview on failure
                      } finally {
                        setUploadingAvatar(false);
                      }
                    }
                  }}
                />
                <Button variant="outline" className="w-full pointer-events-none" disabled={uploadingAvatar}>
                  {uploadingAvatar ? 'Uploading...' : 'Upload Picture'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 border-border/50">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    disabled 
                    value={formData.email} 
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    onBlur={handleAutoSavePhone}
                    placeholder="Auto-saves on leave"
                  />
                </div>

                {user?.role === 'user' && (
                  <>
                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="universityId">University ID</Label>
                      <Input
                        id="universityId"
                        name="universityId"
                        type="text"
                        placeholder="E.g. 21BCE102"
                        value={formData.universityId}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <Label htmlFor="location">Current Location</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs px-2 text-primary cursor-pointer"
                          onClick={() => {
                            if ('geolocation' in navigator) {
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  const { latitude, longitude } = position.coords;
                                  try {
                                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                    const data = await response.json();
                                    
                                    if (data && data.address) {
                                      const address = data.address;
                                      const city = address.city || address.town || address.village || address.state_district;
                                      const state = address.state;
                                      const country = address.country;
                                      
                                      const displayLocation = [city, state, country].filter(Boolean).join(', ');
                                      setFormData(prev => ({ ...prev, location: displayLocation || `${latitude}, ${longitude}` }));
                                    } else {
                                      setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                                    }
                                  } catch (err) {
                                    setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                                  }
                                },
                                (error) => console.error('Geolocation error', error)
                              );
                            }
                          }}
                        >
                          <LocateFixed className="w-3 h-3 mr-1" />
                          Auto-fill my location
                        </Button>
                      </div>
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="Vacant"
                        value={formData.location || ''}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {user?.role === 'vendor' && (
                  <>
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          type="text"
                          placeholder="Your Business Name"
                          value={formData.businessName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                          id="businessPhone"
                          name="businessPhone"
                          type="tel"
                          placeholder="Business Contact Number"
                          value={formData.businessPhone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <Label htmlFor="businessAddress">Business Address</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2 text-primary cursor-pointer"
                            onClick={() => {
                              if ('geolocation' in navigator) {
                                navigator.geolocation.getCurrentPosition(
                                  async (position) => {
                                    const { latitude, longitude } = position.coords;
                                    try {
                                      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                      const data = await response.json();
                                      
                                      if (data && data.address) {
                                        const address = data.address;
                                        const city = address.city || address.town || address.village || address.state_district;
                                        const state = address.state;
                                        const country = address.country;
                                        
                                        const displayLocation = [city, state, country].filter(Boolean).join(', ');
                                        setFormData(prev => ({ ...prev, businessAddress: displayLocation || `${latitude}, ${longitude}` }));
                                      } else {
                                        setFormData(prev => ({ ...prev, businessAddress: `${latitude}, ${longitude}` }));
                                      }
                                    } catch (err) {
                                      setFormData(prev => ({ ...prev, businessAddress: `${latitude}, ${longitude}` }));
                                    }
                                  },
                                  (error) => console.error('Geolocation error', error)
                                );
                              }
                            }}
                          >
                            <LocateFixed className="w-3 h-3 mr-1" />
                            Auto-fill my location
                          </Button>
                        </div>
                        <Input
                          id="businessAddress"
                          name="businessAddress"
                          type="text"
                          placeholder="Vacant"
                          value={formData.businessAddress}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <textarea
                          id="description"
                          name="description"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Vacant"
                          value={formData.description}
                          onChange={handleChange as any}
                        />
                      </div>
                    </div>
                      <div className="space-y-2 pb-2 mt-4">
                        <Label htmlFor="serviceType">Primary Service Type</Label>
                        <select
                          id="serviceType"
                          name="serviceType"
                          disabled={!!user?.serviceType}
                          value={formData.serviceType}
                          onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select Service Type</option>
                          <option value="CAR">Car Rental</option>
                          <option value="ROOM">Room / PG Rental</option>
                          <option value="LAUNDRY">Laundry Service</option>
                        </select>
                        {user?.serviceType && (
                          <p className="text-[10px] text-muted-foreground">Service type is locked once established.</p>
                        )}
                      </div>
                  </>
                )}

                <Button type="submit" disabled={loading} className="mt-4 cursor-pointer">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
