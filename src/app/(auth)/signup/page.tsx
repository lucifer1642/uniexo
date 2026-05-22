'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Sparkles, Store, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from 'sonner';
import { UniExoBrand } from '@/components/brand';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [step, setStep] = useState(0); // 0: Identity, 1: Role, 2: Profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    universityId: '',
    businessName: '',
    serviceType: '',
    onsitePickup: false,
    storeDelivery: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'vendor'>('user');

  // If already logged in, redirect away
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      const path = user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/dashboard' : '/';
      router.replace(path);
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
        setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
        setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const proceedToRole = () => {
    if (!formData.email || !formData.password) {
      toast.error("Credentials required");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords mismatch");
      return;
    }
    setStep(1);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('[SIGNUP] Finalizing registration...');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: role,
          university_id: role === 'user' ? formData.universityId : undefined,
          business_name: role === 'vendor' ? formData.businessName : undefined,
          service_type: role === 'vendor' ? formData.serviceType : undefined,
          onsite_pickup: role === 'vendor' && formData.serviceType === 'laundry' ? formData.onsitePickup : undefined,
          store_delivery: role === 'vendor' && formData.serviceType === 'laundry' ? formData.storeDelivery : undefined,
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }

      console.log('[SIGNUP] Success');
      
      // If OTP is required, redirect to verify-otp page
      if (data.otpRequired) {
        toast.success("Verification code sent to your email!");
        router.replace(`/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=signup`);
        return;
      }

      // Auto-login (OTP not required)
      const userState = {
        id: data.profile.id,
        uniId: data.profile.uniId,
        name: data.profile.name,
        email: data.profile.email,
        role: data.profile.role,
        authProvider: data.profile.authProvider || 'email',
        serviceType: data.profile.serviceType,
        phone: data.profile.phone,
        kycStatus: data.profile.kycStatus
      };
      
      useAuthStore.getState().login(userState, data.token);

      toast.success("Welcome to UniExo!");

      const redirectPath = role === 'vendor' ? '/dashboard' : '/';
      router.replace(redirectPath);

    } catch (err: any) {
      console.error('Finalize error:', err);
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 sm:p-6 font-sans theme-landing relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -right-1/4 sm:right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-secondary/10 rounded-full blur-[80px] sm:blur-[120px] -z-10"
      />
      <motion.div 
        animate={{ y: [0, 60, 0], x: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 -left-1/4 sm:left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/10 rounded-full blur-[100px] sm:blur-[150px] -z-10"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] backdrop-blur-xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <UserPlus className="w-8 h-8 text-secondary" />
          </motion.div>
          <UniExoBrand size="lg" className="mb-2 justify-center" />
          <h1 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">
            {step === 0 ? "Step 1: Identity" : step === 1 ? "Step 2: Role" : "Step 3: Profile"}
          </h1>
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-secondary' : 'w-4 bg-border'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <Button
                type="button"
                onClick={async () => {
                  const res = await fetch('/api/auth/google', { method: 'POST', body: JSON.stringify({}) });
                  const data = await res.json();
                  if (!data.success) toast.error(data.error);
                }}
                className="w-full h-14 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-transparent px-2 text-muted-foreground font-bold uppercase tracking-widest">Or</span></div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Email Address</Label>
                  <Input name="email" type="email" placeholder="vendor@example.com" value={formData.email} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
                </div>
                <div className="space-y-2 relative group">
                  <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Password</Label>
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="•••••••• (Min 6)" value={formData.password} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-muted-foreground hover:text-foreground transition-colors p-2">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Confirm Password</Label>
                  <Input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={proceedToRole} className="w-full h-14 bg-secondary text-secondary-foreground font-black text-[13px] tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-secondary/20 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]" />
                  <span className="relative z-10 flex items-center justify-center gap-2">Next Step <ArrowRight size={16} /></span>
                </Button>
              </motion.div>
              <div className="text-center pt-4">
                 <Link href="/login" className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider hover:text-secondary transition-colors underline-offset-4 hover:underline">
                   Already have access? Log in
                 </Link>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setRole('user')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${role === 'user' ? 'border-primary bg-primary/10 text-primary shadow-xl shadow-primary/10 scale-105' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 text-muted-foreground hover:bg-white/50 shadow-inner'}`}>
                  <Sparkles className="w-8 h-8" />
                  <div className="font-black text-sm uppercase tracking-wider">Student</div>
                </button>
                <button onClick={() => setRole('vendor')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${role === 'vendor' ? 'border-secondary bg-secondary/10 text-secondary shadow-xl shadow-secondary/10 scale-105' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 text-muted-foreground hover:bg-white/50 shadow-inner'}`}>
                  <Store className="w-8 h-8" />
                  <div className="font-black text-sm uppercase tracking-wider">Vendor</div>
                </button>
              </div>

              <AnimatePresence>
                {role === 'vendor' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-4 border-t border-border/50">
                    <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Service Type</Label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground px-5 outline-none focus:border-secondary transition-colors text-sm font-bold shadow-inner">
                      <option value="" className="bg-background">Select Category</option>
                      <option value="vehicle" className="bg-background">Car/Bike Rental</option>
                      <option value="house" className="bg-background">PG/Room Rental</option>
                      <option value="laundry" className="bg-background">Laundry Services</option>
                    </select>

                    {formData.serviceType === 'laundry' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 grid grid-cols-2 gap-3">
                          <label className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.onsitePickup ? 'border-secondary bg-secondary/5 text-secondary' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 text-muted-foreground shadow-inner'}`}>
                              <input type="checkbox" name="onsitePickup" checked={formData.onsitePickup} onChange={handleChange} className="sr-only" />
                              <span className="text-xs font-black uppercase tracking-wider text-center">Onsite Pickup</span>
                          </label>
                          <label className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.storeDelivery ? 'border-secondary bg-secondary/5 text-secondary' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 text-muted-foreground shadow-inner'}`}>
                              <input type="checkbox" name="storeDelivery" checked={formData.storeDelivery} onChange={handleChange} className="sr-only" />
                              <span className="text-xs font-black uppercase tracking-wider text-center">Store Delivery</span>
                          </label>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => setStep(0)} variant="outline" className="flex-1 h-14 border-border/50 rounded-2xl text-muted-foreground hover:bg-surface hover:text-foreground font-bold uppercase tracking-wider text-[12px]">Back</Button>
                <Button onClick={() => setStep(2)} className="flex-1 h-14 bg-secondary text-secondary-foreground font-black text-[13px] tracking-widest uppercase rounded-2xl shadow-xl shadow-secondary/20" disabled={role === 'vendor' && !formData.serviceType}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Full Name</Label>
                <Input name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Phone Number</Label>
                <Input name="phone" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
              </div>
              
              {role === 'user' ? (
                <div className="space-y-2">
                  <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">University ID</Label>
                  <Input name="universityId" placeholder="12345678" value={formData.universityId} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 transition-all text-base px-5 shadow-inner" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Business Name</Label>
                  <Input name="businessName" placeholder="Doe Enterprises" value={formData.businessName} onChange={handleChange} className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-secondary/30 transition-all text-base px-5 shadow-inner" />
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                  {error}
                </motion.div>
              )}
              
              <div className="flex gap-4 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-[0.5] h-14 border-border/50 rounded-2xl text-muted-foreground hover:bg-surface hover:text-foreground font-bold uppercase tracking-wider text-[12px]">Back</Button>
                <motion.div className="flex-[1.5]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleFinalize} disabled={loading} className={`w-full h-14 font-black text-[13px] tracking-widest uppercase rounded-2xl transition-all shadow-xl group overflow-hidden relative ${role === 'user' ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-secondary text-secondary-foreground shadow-secondary/20'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? "SYNCING..." : "FINALIZE SETUP"} <ShieldCheck size={16} />
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">
          Secured by UniExo Encryption
        </p>
      </motion.div>
    </div>
  );
}
