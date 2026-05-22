'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Upload, Landmark, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface KycUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KycUploadDialog({ isOpen, onClose }: KycUploadDialogProps) {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [bankDetails, setBankDetails] = useState({
    accountHolder: user?.name || '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  
  const [idProof, setIdProof] = useState<File | null>(null);

  const handleKycSubmit = async () => {
    if (!idProof) {
      toast.error('Identity Proof is required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('idProof', idProof);
      formData.append('bankDetails', JSON.stringify(bankDetails));

      await api.post('/users/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('KYC documents submitted for review!');
      
      // Update local user state
      if (user) {
        updateUser({ kycStatus: 'pending' });
      }
      
      setStep(3); // Success step
    } catch (error: any) {
      console.error('KYC Submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground rounded-[2rem] overflow-hidden theme-landing">
        <DialogHeader className="p-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <DialogTitle className="text-3xl font-black text-center tracking-tighter">Identity <span className="text-primary">Verification</span></DialogTitle>
          <DialogDescription className="text-muted-foreground text-center text-sm font-medium">
            Verify your account to unlock premium rentals and vendor features.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 py-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-2xl">
                 <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Landmark className="w-4 h-4" />
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Step 1: Bank Details</span>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Account Holder Name</Label>
                  <Input 
                    value={bankDetails.accountHolder}
                    onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                    placeholder="Enter full name"
                    className="bg-surface border-border rounded-xl h-12 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Bank Name</Label>
                  <Input 
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder="e.g. HDFC Bank"
                    className="bg-surface border-border rounded-xl h-12 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Account Number</Label>
                    <Input 
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      placeholder="XXXX XXXX XXXX"
                      className="bg-surface border-border rounded-xl h-12 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">IFSC Code</Label>
                    <Input 
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                      placeholder="e.g. HDFC0001234"
                      className="bg-surface border-border rounded-xl h-12 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setStep(2)}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black hover:opacity-90 shadow-xl shadow-primary/20"
              >
                NEXT: DOCUMENT UPLOAD
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-2xl">
                 <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-4 h-4" />
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Step 2: ID Card Upload</span>
              </div>

              <div 
                className={`relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all text-center flex flex-col items-center justify-center gap-4 ${idProof ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/20 bg-surface'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) setIdProof(e.dataTransfer.files[0]);
                }}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => e.target.files?.[0] && setIdProof(e.target.files[0])}
                  accept="image/*"
                />
                <div className={`p-6 rounded-3xl ${idProof ? 'bg-primary text-primary-foreground' : 'bg-muted/10 text-muted-foreground'}`}>
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{idProof ? idProof.name : 'Upload Identity Proof'}</h4>
                  <p className="text-xs text-muted-foreground">Drag & drop or click to browse. (JPG, PNG)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-14 rounded-2xl text-muted-foreground hover:text-foreground font-black"
                  disabled={loading}
                >
                  BACK
                </Button>
                <Button 
                  onClick={handleKycSubmit}
                  disabled={loading || !idProof}
                  className="h-14 rounded-2xl bg-primary text-primary-foreground font-black hover:opacity-90 shadow-xl shadow-primary/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SUBMIT VERIFICATION'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 text-center space-y-6">
              <div className="mx-auto w-24 h-24 rounded-[2rem] bg-secondary/20 text-secondary flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter mb-2">Documents <span className="text-secondary">Received!</span></h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Our administrators are reviewing your submission. You'll be notified once verified.</p>
              </div>
              <Button 
                onClick={onClose}
                className="w-full h-14 rounded-2xl bg-foreground text-background font-black hover:opacity-90"
              >
                CLOSE PORTAL
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
