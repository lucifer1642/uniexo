'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Sparkles, Store } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

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
      console.log('[SIGNUP] Already authenticated, forcing redirect to:', path);
      window.location.href = path;
    }
  }, [isAuthenticated, user, _hasHydrated]);

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
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      console.log('[SIGNUP] Success, auto-logging in...');
      
      // Auto-login
      useAuthStore.getState().login({
        id: data.profile.id,
        name: data.profile.name,
        email: data.profile.email,
        role: data.profile.role,
        serviceType: data.profile.service_type,
        phone: data.profile.phone,
        kycStatus: data.profile.kyc_status
      }, data.token);
      
      toast.success("Welcome to UniExo!");

      const redirectPath = role === 'vendor' ? '/dashboard' : '/';
      console.log('[SIGNUP] Redirecting to:', redirectPath);

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);

    } catch (err: any) {
      console.error('Finalize error:', err);
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            {step === 0 ? "Identity" : step === 1 ? "Role" : "Profile"}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="space-y-4">
                <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
                <div className="relative">
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="Password (Min 6 chars)" value={formData.password} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
              </div>
              <Button onClick={proceedToRole} className="w-full h-12 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700">Next Step</Button>
              <div className="text-center pt-4">
                 <Link href="/login" className="text-zinc-500 text-xs font-bold hover:text-lime-500 transition-colors">
                   Already have access? Log in
                 </Link>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setRole('user')} className={`p-6 rounded-2xl border transition-all ${role === 'user' ? 'border-lime-500 bg-lime-500/10 text-lime-400' : 'border-zinc-800 text-zinc-500'}`}>
                  <Sparkles className="mx-auto mb-2" />
                  <div className="font-bold">Student</div>
                </button>
                <button onClick={() => setRole('vendor')} className={`p-6 rounded-2xl border transition-all ${role === 'vendor' ? 'border-lime-500 bg-lime-500/10 text-lime-400' : 'border-zinc-800 text-zinc-500'}`}>
                  <Store className="mx-auto mb-2" />
                  <div className="font-bold">Vendor</div>
                </button>
              </div>

              {role === 'vendor' && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Service Type</label>
                  <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full h-12 bg-black border-zinc-800 rounded-xl text-white px-3 outline-none">
                    <option value="">Select Category</option>
                    <option value="vehicle">Car Rental</option>
                    <option value="house">PG Rental</option>
                    <option value="laundry">Laundry</option>
                  </select>

                  {formData.serviceType === 'laundry' && (
                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 p-3 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                            <input type="checkbox" name="onsitePickup" checked={formData.onsitePickup} onChange={handleChange} className="w-4 h-4 accent-lime-500" />
                            <span className="text-sm font-medium text-white">Onsite Pickup</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                            <input type="checkbox" name="storeDelivery" checked={formData.storeDelivery} onChange={handleChange} className="w-4 h-4 accent-lime-500" />
                            <span className="text-sm font-medium text-white">Store Delivery</span>
                        </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={() => setStep(0)} variant="outline" className="flex-1 h-12 border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-white">Back</Button>
                <Button onClick={() => setStep(2)} className="flex-1 h-12 bg-lime-500 text-black font-bold rounded-xl hover:bg-lime-400" disabled={role === 'vendor' && !formData.serviceType}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
              <Input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
              
              {role === 'user' ? (
                <Input name="universityId" placeholder="University ID" value={formData.universityId} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
              ) : (
                <Input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white placeholder:text-zinc-700" />
              )}

              {error && <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg">{error}</div>}
              
              <div className="flex gap-4 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-white">Back</Button>
                <Button onClick={handleFinalize} disabled={loading} className="flex-1 h-12 bg-lime-500 text-black font-black rounded-xl hover:bg-lime-400">
                  {loading ? "SYNCING..." : "FINALIZE"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
          Secured by UniExo Nexus
        </p>
      </div>
    </div>
  );
}
