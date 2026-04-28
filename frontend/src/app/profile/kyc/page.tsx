'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  CreditCard, 
  Upload, 
  FileCheck, 
  FileWarning, 
  FileText, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface KycDocument {
  type: string;
  file?: File;
  url?: string;
  status: 'empty' | 'uploading' | 'done';
}

export default function KycPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  
  const [bankDetails, setBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  const [docs, setDocs] = useState<Record<string, KycDocument>>({
    identity_proof: { type: 'identity_proof', status: 'empty' },
    business_proof: { type: 'business_proof', status: 'empty' },
  });

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await api.get('/users/profile');
      const userData = res.data.data;
      updateUser(userData);
      
      if (userData.bankDetails) {
        setBankDetails(userData.bankDetails);
      }
      
      // Also fetch the full KYC request if it exists
      const kycRes = await api.get('/vendors/kyc-status').catch(() => null);
      if (kycRes?.data?.data) {
        setKycData(kycRes.data.data);
        const savedDocs = kycRes.data.data.documents || [];
        const newDocs = { ...docs };
        savedDocs.forEach((d: any) => {
          if (newDocs[d.type]) {
            newDocs[d.type] = { ...newDocs[d.type], url: d.url, status: 'done' };
          }
        });
        setDocs(newDocs);
      }
    } catch (err) {
      console.error('Failed to fetch KYC status', err);
    }
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocs(prev => ({
        ...prev,
        [type]: { ...prev[type], file, status: 'done' }
      }));
    }
  };

  const removeFile = (type: string) => {
    setDocs(prev => ({
      ...prev,
      [type]: { ...prev[type], file: undefined, url: undefined, status: 'empty' }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
      return toast.error('Please fill in essential bank details');
    }

    const missingDocs = Object.values(docs).filter(d => !d.file && !d.url);
    if (missingDocs.length > 0) {
      return toast.error('Please upload all required documents');
    }

    setLoading(true);
    try {
      // 1. Upload new files if any
      const finalDocs = [];
      for (const key in docs) {
        const d = docs[key];
        if (d.file) {
          const formData = new FormData();
          formData.append('document', d.file);
          formData.append('type', d.type);
          const uploadRes = await api.post('/users/kyc-document', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalDocs.push({ type: d.type, url: uploadRes.data.data.url });
        } else if (d.url) {
          finalDocs.push({ type: d.type, url: d.url });
        }
      }

      // 2. Submit KYC Request
      await api.post('/users/kyc-submit', {
        bankDetails,
        documents: finalDocs
      });

      toast.success('KYC application submitted successfully');
      fetchKycStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const isPending = user?.kycStatus === 'pending';
  const isApproved = user?.kycStatus === 'approved';
  const isRejected = user?.kycStatus === 'rejected';

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">KYC & Bank Details</h1>
          <p className="text-muted-foreground">Complete your verification to receive payments and host services.</p>
        </div>

        {isApproved && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Verified Account</p>
              <p className="text-sm">Your identity and bank details have been verified by Uniexo.</p>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Verification Pending</p>
              <p className="text-sm">Our admin team is reviewing your documents. This usually takes 24-48 hours.</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Verification Rejected</p>
              <p className="text-sm">Reason: {kycData?.rejectionReason || 'Documents were not clear.'}. Please re-submit.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-primary/10 text-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Bank Information</CardTitle>
                    <CardDescription>Where you'll receive your payouts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input 
                    id="accountHolder" 
                    name="accountHolder" 
                    placeholder="As per bank records"
                    value={bankDetails.accountHolder}
                    onChange={handleBankChange}
                    disabled={isPending || isApproved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input 
                    id="bankName" 
                    name="bankName" 
                    placeholder="e.g. HDFC Bank"
                    value={bankDetails.bankName}
                    onChange={handleBankChange}
                    disabled={isPending || isApproved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input 
                    id="accountNumber" 
                    name="accountNumber" 
                    type="password"
                    placeholder="••••••••••••"
                    value={bankDetails.accountNumber}
                    onChange={handleBankChange}
                    disabled={isPending || isApproved}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input 
                    id="ifscCode" 
                    name="ifscCode" 
                    placeholder="e.g. HDFC0001234"
                    className="uppercase"
                    value={bankDetails.ifscCode}
                    onChange={handleBankChange}
                    disabled={isPending || isApproved}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-primary/10 text-primary">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Verification Documents</CardTitle>
                    <CardDescription>PDF or Image (Max 5MB)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(docs).map(([key, doc]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize">{key.replace('_', ' ')}</Label>
                      {doc.status === 'done' && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                          Ready
                        </Badge>
                      )}
                    </div>
                    
                    {doc.status === 'empty' ? (
                      <div className="relative group">
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
                          onChange={(e) => handleFileChange(key, e)}
                          disabled={isPending || isApproved}
                        />
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                          <Upload className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-xs font-medium">Click to upload {key.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded border">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[150px]">
                              {doc.file ? doc.file.name : 'Document Uploaded'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Verification document</p>
                          </div>
                        </div>
                        {!(isPending || isApproved) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-500 cursor-pointer"
                            onClick={() => removeFile(key)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              type="submit" 
              disabled={loading || isPending || isApproved} 
              className="px-8 cursor-pointer"
            >
              {loading ? 'Submitting...' : isApproved ? 'Verified' : isPending ? 'Pending Review' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
