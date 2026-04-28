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
import { LocateFixed, CreditCard, CheckCircle2, Clock, AlertCircle, Upload, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [businessProofFile, setBusinessProofFile] = useState<File | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null);
  const [businessProofPreview, setBusinessProofPreview] = useState<string | null>(null);

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
    accountHolder: user?.bankDetails?.accountHolder || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    bankName: user?.bankDetails?.bankName || '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        universityId: user.universityId || '',
        accountHolder: user.bankDetails?.accountHolder || '',
        accountNumber: user.bankDetails?.accountNumber || '',
        ifscCode: user.bankDetails?.ifscCode || '',
        bankName: user.bankDetails?.bankName || '',
      }));
    }
  }, [user]);

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
      
      const response = await api.patch('/users/profile', updateData);
      let updatedUser = response.data.data;

      if (user?.role === 'vendor') {
        const vendorUpdates: Record<string, string> = {};
        if (formData.businessName) vendorUpdates.businessName = formData.businessName;
        if (formData.businessAddress) vendorUpdates.businessAddress = formData.businessAddress;
        if (formData.businessPhone) vendorUpdates.businessPhone = formData.businessPhone;
        if (formData.description) vendorUpdates.description = formData.description;
        
        if (Object.keys(vendorUpdates).length > 0) {
          await api.patch('/vendors/profile', vendorUpdates);
        }
      }

      if (updatedUser) {
        updateUser(updatedUser);
      }
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!idProofFile && !user?.kycDocuments?.some((d: any) => d.type === 'id_proof')) {
        toast.error('Identity Proof is required for KYC');
        setLoading(false);
        return;
      }

      const kycData = new FormData();
      const bankDetails = {
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
      };
      
      kycData.append('bankDetails', JSON.stringify(bankDetails));
      if (idProofFile) kycData.append('idProof', idProofFile);
      if (businessProofFile) kycData.append('businessProof', businessProofFile);

      const response = await api.post('/users/kyc', kycData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateUser({ 
        bankDetails: bankDetails,
        kycStatus: response.data.data.status 
      });
      toast.success('KYC details and documents submitted for approval');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC details');
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = () => {
    const status = user?.kycStatus || 'none';
    switch (status) {
      case 'approved':
        return <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</div>;
      case 'pending':
        return <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-100"><Clock className="w-3.5 h-3.5" /> Pending Approval</div>;
      case 'rejected':
        return <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-100"><AlertCircle className="w-3.5 h-3.5" /> Rejected</div>;
      default:
        return <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-100">Not Submitted</div>;
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
                <Button variant="outline" className="w-full pointer-events-none cursor-pointer" disabled={uploadingAvatar}>
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
                            className="h-6 text-xs px-2 text-primary"
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
                      <Label htmlFor="serviceType">Primary Service</Label>
                      <Input
                        id="serviceType"
                        name="serviceType"
                        type="text"
                        disabled
                        placeholder="E.g. CAR"
                        className="bg-muted"
                        value={formData.serviceType}
                      />
                    </div>
                  </>
                )}

                <Button type="submit" disabled={loading} className="mt-4 cursor-pointer">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-3 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bank Details & KYC</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Provide your bank details for payments and settlements.</p>
              </div>
              {getKycBadge()}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    name="accountHolder"
                    placeholder="Enter full name"
                    value={formData.accountHolder}
                    onChange={handleChange}
                    className="cursor-pointer"
                    disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    placeholder="E.g. HDFC Bank"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="cursor-pointer"
                    disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="cursor-pointer"
                    disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    name="ifscCode"
                    placeholder="E.g. HDFC0001234"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    className="cursor-pointer"
                    disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Identity Proof <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Aadhar / PAN / Passport)</span>
                    </Label>
                    <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                      {idProofPreview ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={idProofPreview} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => { setIdProofFile(null); setIdProofPreview(null); }}
                            className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                          <div className="p-3 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-medium">Click to upload ID Proof</p>
                          <p className="text-[10px] text-muted-foreground">JPG, PNG or PDF (Max 5MB)</p>
                        </div>
                      )}
                      <Input 
                        type="file" 
                        accept="image/*,application/pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setIdProofFile(e.target.files[0]);
                            setIdProofPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Business Proof
                      <span className="text-[10px] text-muted-foreground font-normal">(GST / Trade License / Work ID)</span>
                    </Label>
                    <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                      {businessProofPreview ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={businessProofPreview} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => { setBusinessProofFile(null); setBusinessProofPreview(null); }}
                            className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                          <div className="p-3 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-medium">Click to upload Business Proof</p>
                          <p className="text-[10px] text-muted-foreground">Optional for individuals</p>
                        </div>
                      )}
                      <Input 
                        type="file" 
                        accept="image/*,application/pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setBusinessProofFile(e.target.files[0]);
                            setBusinessProofPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        disabled={user?.kycStatus === 'approved' || user?.kycStatus === 'pending'}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading || user?.kycStatus === 'approved' || user?.kycStatus === 'pending'} 
                    className="cursor-pointer"
                  >
                    {user?.kycStatus === 'pending' ? 'Verification Pending' : user?.kycStatus === 'approved' ? 'Verified' : 'Submit for KYC'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
