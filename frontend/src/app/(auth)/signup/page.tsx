'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Eye, EyeOff, LocateFixed, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export default function SignupPage() {
  const router = useRouter();
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
    location: '',
    businessName: '',
    serviceType: '',
  });

  const [googleUser, setGoogleUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'vendor' | 'admin'>('user');

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 0: Google Authentication
  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (user && user.email) {
        const idToken = await user.getIdToken();
        setGoogleUser({ user, idToken });
        setFormData(prev => ({
          ...prev,
          name: user.displayName || '',
          email: user.email || '',
          password: `GOOGLE_${user.uid}`, // Deterministic bridge pass
          confirmPassword: `GOOGLE_${user.uid}`
        }));
        setStep(1);
        toast.success("Identity Verified!");
      }
    } catch (err: any) {
      console.error('Google error:', err);
      toast.error(err.message || "Google auth failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 0: Manual Initial Validation
  const proceedToRole = () => {
    if (!formData.email || !formData.password) {
      toast.error("Credentials required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords mismatch");
      return;
    }
    setStep(1);
  };

  // Final Step: Simple DB Operation
  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let authUser: any = null;
      let session: any = null;

      // 1. Authenticate with Supabase
      if (googleUser) {
        const { data, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.idToken,
        });

        if (authError) {
          // Fallback to password sign up if provider is disabled
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
          });
          if (signUpError) throw signUpError;
          authUser = signUpData.user;
          session = signUpData.session;
        } else {
          authUser = data.user;
          session = data.session;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (signUpError) throw signUpError;
        authUser = data.user;
        session = data.session;
      }

      if (!authUser) throw new Error("Auth initialization failed");

      // 2. Save Profile (Simple DB Operation)
      const profileData = {
        id: authUser.id,
        email: authUser.email,
        name: formData.name,
        phone: formData.phone,
        role: role,
        university_id: role === 'user' ? formData.universityId : undefined,
        business_name: role === 'vendor' ? formData.businessName : undefined,
        service_type: role === 'vendor' ? formData.serviceType : undefined,
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase.from('profiles').upsert(profileData);
      if (dbError) {
        console.warn("Profile upsert failed, but auth succeeded:", dbError.message);
        // We don't crash here, because the user is already signed up in Auth.
        // We'll try one more time or just log it.
      }

      // 3. Sync to Firebase (Optional Redundancy)
      try {
        await set(ref(db, 'profiles/' + authUser.id), profileData);
      } catch (f) { console.error("RTDB sync skipped"); }

      // 4. Log in and redirect
      if (session) {
        useAuthStore.getState().login({
          id: authUser.id,
          name: profileData.name,
          email: authUser.email!,
          role: role
        }, session.access_token);
        
        toast.success("Welcome to UniExo!");
        router.push(role === 'admin' ? '/admin' : '/dashboard');
      } else {
        toast.info("Account ready! Please log in.");
        router.push('/login');
      }

    } catch (err: any) {
      console.error('Finalize error:', err);
      setError(err.message || "Registration failed");
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
            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Button onClick={handleGoogleAuth} className="w-full h-14 bg-white text-black font-bold rounded-xl hover:bg-zinc-200">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="G" />
                Continue with Google
              </Button>
              <div className="text-zinc-700 text-center text-[10px] font-bold uppercase tracking-widest">or manual</div>
              <div className="space-y-4">
                <Input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
                <div className="relative">
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
              </div>
              <Button onClick={proceedToRole} className="w-full h-12 bg-zinc-800 text-white font-bold rounded-xl">Next Step</Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
              <div className="flex gap-4">
                <Button onClick={() => setStep(0)} variant="outline" className="flex-1 h-12 border-zinc-800 rounded-xl text-zinc-500">Back</Button>
                <Button onClick={() => setStep(2)} className="flex-1 h-12 bg-lime-500 text-black font-bold rounded-xl">Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
              <Input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
              
              {role === 'user' ? (
                <Input name="universityId" placeholder="University ID" value={formData.universityId} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
              ) : (
                <>
                  <Input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl" />
                  <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full h-12 bg-black border-zinc-800 rounded-xl text-white px-3 outline-none">
                    <option value="">Select Category</option>
                    <option value="vehicle">Car Rental</option>
                    <option value="house">PG Rental</option>
                    <option value="laundry">Laundry</option>
                  </select>
                </>
              )}

              {error && <div className="text-red-500 text-xs text-center font-bold">{error}</div>}
              
              <div className="flex gap-4 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-zinc-800 rounded-xl text-zinc-500">Back</Button>
                <Button onClick={handleFinalize} disabled={loading} className="flex-1 h-12 bg-lime-500 text-black font-black rounded-xl">
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
