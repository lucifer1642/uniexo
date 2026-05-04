'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Building, CheckCircle2, Eye, EyeOff, LocateFixed, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';
import { LegalModal } from '@/components/legal-modal';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [onsitePickup, setOnsitePickup] = useState(false);
  const [onStoreService, setOnStoreService] = useState(true);
  const [onsitePickupCharge, setOnsitePickupCharge] = useState('');

  const [legalModal, setLegalModal] = useState<{ open: boolean, title: string, content: React.ReactNode }>({
    open: false,
    title: '',
    content: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole: 'user' | 'vendor') => {
    setRole(newRole);
  };

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      setError('');
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
              
              setFormData(prev => ({ 
                ...prev, 
                location: displayLocation || `${latitude}, ${longitude}` 
              }));
            } else {
              setFormData(prev => ({ 
                ...prev, 
                location: `${latitude}, ${longitude}` 
              }));
            }
          } catch (err) {
            console.error('Failed to reverse geocode', err);
            setFormData(prev => ({ 
              ...prev, 
              location: `${latitude}, ${longitude}` 
            }));
          }
        },
        (error) => {
          console.error('Geolocation permission denied or error', error);
          setError('Could not fetch location. Please allow location permissions or type it manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const isProd = process.env.NODE_ENV === 'production';
      const apiUrl = isProd ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');

      // 1. Trigger OTP in backend
      const response = await fetch(`${apiUrl}/auth/send-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send verification code');
      }

      setOtpStep(true);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError('');

    try {
      const isProd = process.env.NODE_ENV === 'production';
      const apiUrl = isProd ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');

      // 1. Verify OTP with backend
      const verifyRes = await fetch(`${apiUrl}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp, purpose: 'signup' })
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Invalid verification code');
      }

      // 2. Perform Supabase Signup
      const metadata: any = {
        name: formData.name,
        phone: formData.phone,
        role,
      };

      if (role === 'user') {
        metadata.universityId = formData.universityId;
        metadata.location = formData.location;
      } else if (role === 'vendor') {
        metadata.businessName = formData.businessName;
        metadata.serviceType = formData.serviceType;
        if (formData.serviceType === 'LAUNDRY') {
          metadata.onsitePickup = onsitePickup;
          metadata.onStoreService = onStoreService;
          metadata.onsitePickupCharge = Number(onsitePickupCharge) || 0;
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: metadata,
        }
      });

      if (signUpError) throw signUpError;

      if (data.session && data.user) {
        const { login } = useAuthStore.getState();
        login(
          {
            id: data.user.id,
            name: metadata.name,
            email: formData.email,
            phone: metadata.phone,
            role: metadata.role || 'user',
            avatar: data.user.user_metadata?.avatar,
            kycStatus: 'none',
          },
          data.session.access_token
        );
        toast.success('Welcome to UniExo! 🎉', { icon: '✨' });
        router.push('/');
      } else {
        toast.success('Account created successfully!', { icon: '✅' });
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRedirectWrapper>
      <div className="min-h-screen relative flex items-center justify-center py-20 overflow-x-hidden bg-black selection:bg-lime-500/30 selection:text-lime-200">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 150, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-lime-500/10 rounded-full blur-[140px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -150, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-green-600/10 rounded-full blur-[140px]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-2xl px-4"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white">
              {otpStep ? 'VERIFY EMAIL' : <><span className="text-lime-400">Account</span> Creation</>}
            </h2>
            <p className="mt-4 text-zinc-400 font-medium">
              {otpStep ? `Enter code sent to ${formData.email}` : (
                <>Already with us? <Link href="/login" className="text-lime-400 hover:text-lime-300 transition-colors font-bold">Log in here</Link></>
              )}
            </p>
          </div>

          <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/10 shadow-2xl rounded-[2.5rem] p-8 sm:p-12">
            <AnimatePresence mode="wait">
              {!otpStep ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="mb-10 flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('user')}
                      className={`flex-1 group relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                        role === 'user' 
                          ? 'border-lime-500/50 bg-lime-500/5 text-lime-400 ring-4 ring-lime-500/10' 
                          : 'border-white/5 bg-white/[0.02] text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className={`p-3 rounded-xl mb-3 transition-colors ${role === 'user' ? 'bg-lime-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">General User</span>
                      <span className="text-xs mt-1 opacity-60">Rent & Buy Easily</span>
                      {role === 'user' && (
                        <motion.div layoutId="role-active" className="absolute -top-2 -right-2 bg-lime-400 text-black p-1 rounded-full shadow-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleRoleChange('vendor')}
                      className={`flex-1 group relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
                        role === 'vendor' 
                          ? 'border-lime-500/50 bg-lime-500/5 text-lime-400 ring-4 ring-lime-500/10' 
                          : 'border-white/5 bg-white/[0.02] text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className={`p-3 rounded-xl mb-3 transition-colors ${role === 'vendor' ? 'bg-lime-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        <div className="flex -space-x-1">
                          <Car className="w-5 h-5" />
                          <Building className="w-5 h-5" />
                        </div>
                      </div>
                      <span className="font-bold text-lg">Vendor</span>
                      <span className="text-xs mt-1 opacity-60">List & Scale Business</span>
                      {role === 'vendor' && (
                        <motion.div layoutId="role-active" className="absolute -top-2 -right-2 bg-lime-400 text-black p-1 rounded-full shadow-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                      )}
                    </button>
                  </div>

                  <form className="grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={handleInitialSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-zinc-400 text-sm font-medium ml-1">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-400 text-sm font-medium ml-1">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                        placeholder="john@uniexo.in"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-zinc-400 text-sm font-medium ml-1">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    {role === 'user' ? (
                      <div className="space-y-2">
                        <Label htmlFor="universityId" className="text-zinc-400 text-sm font-medium ml-1">University ID</Label>
                        <Input
                          id="universityId"
                          name="universityId"
                          type="text"
                          required
                          className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                          placeholder="E.g. 21BCE102"
                          value={formData.universityId}
                          onChange={handleChange}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-zinc-400 text-sm font-medium ml-1">Business Name</Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          type="text"
                          required
                          className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                          placeholder="Enter Business Name"
                          value={formData.businessName}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    {role === 'user' ? (
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex justify-between items-center ml-1">
                          <Label htmlFor="location" className="text-zinc-400 text-sm font-medium">Current Location</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={fetchLocation}
                            className="h-auto p-0 text-lime-400 hover:text-lime-300 hover:bg-transparent text-xs font-bold"
                          >
                            <LocateFixed className="w-3 h-3 mr-1" />
                            Auto-detect
                          </Button>
                        </div>
                        <Input
                          id="location"
                          name="location"
                          type="text"
                          required
                          className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl"
                          placeholder="Enter location or auto-detect"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="serviceType" className="text-zinc-400 text-sm font-medium ml-1">Service Domain</Label>
                        <select
                          id="serviceType"
                          name="serviceType"
                          required
                          className="flex h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1 text-white shadow-sm transition-colors focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/20"
                          value={formData.serviceType}
                          onChange={handleChange}
                        >
                          <option value="" disabled className="bg-zinc-900 text-zinc-500">Select domain</option>
                          <option value="CAR" className="bg-zinc-900 text-white">Car Rental</option>
                          <option value="ROOM" className="bg-zinc-900 text-white">Room Rental (PG)</option>
                          <option value="LAUNDRY" className="bg-zinc-900 text-white">Laundry Service</option>
                          <option value="FOOD" className="bg-zinc-900 text-white">Food Service</option>
                        </select>
                      </div>
                    )}

                    {role === 'vendor' && formData.serviceType === 'LAUNDRY' && (
                      <div className="sm:col-span-2 space-y-4 p-4 rounded-2xl border border-lime-500/20 bg-lime-500/[0.03]">
                        <p className="text-xs font-bold text-lime-400 uppercase tracking-wider">Laundry Service Options</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="button"
                            onClick={() => setOnsitePickup(!onsitePickup)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-xl border transition-all ${onsitePickup ? 'border-lime-500/50 bg-lime-500/10 text-lime-400' : 'border-white/10 bg-white/[0.02] text-zinc-500'}`}
                          >
                            <span className="text-sm font-medium">Onsite Pickup</span>
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${onsitePickup ? 'bg-lime-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                              <div className="w-4 h-4 rounded-full bg-white mx-1 transition-all" />
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnStoreService(!onStoreService)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-xl border transition-all ${onStoreService ? 'border-lime-500/50 bg-lime-500/10 text-lime-400' : 'border-white/10 bg-white/[0.02] text-zinc-500'}`}
                          >
                            <span className="text-sm font-medium">On Store Service</span>
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${onStoreService ? 'bg-lime-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                              <div className="w-4 h-4 rounded-full bg-white mx-1 transition-all" />
                            </div>
                          </button>
                        </div>
                        {onsitePickup && (
                          <div className="space-y-2">
                            <Label htmlFor="onsitePickupCharge" className="text-zinc-400 text-sm font-medium ml-1">Onsite Pickup Charge (₹)</Label>
                            <Input id="onsitePickupCharge" type="number" min="0" className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl" placeholder="e.g. 50" value={onsitePickupCharge} onChange={(e) => setOnsitePickupCharge(e.target.value)} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password" title="Password" className="text-zinc-400 text-sm font-medium ml-1">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl pr-10"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" title="Confirm Password" className="text-zinc-400 text-sm font-medium ml-1">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl pr-10"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && <div className="sm:col-span-2 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl">{error}</div>}

                    <Button type="submit" className="sm:col-span-2 w-full h-14 text-black bg-lime-400 hover:bg-lime-300 font-black text-lg rounded-2xl transition-all shadow-xl shadow-lime-500/20 active:scale-[0.99] mt-2" disabled={loading}>
                      {loading ? 'Processing...' : 'SEND VERIFICATION CODE'}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="flex justify-center space-x-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full bg-black/40 border border-zinc-800 focus:border-lime-500/50 focus:ring-4 focus:ring-lime-500/10 rounded-2xl px-5 py-4 text-center text-4xl font-black text-lime-500 tracking-[1em] placeholder:text-zinc-800 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {error && <div className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl text-center">{error}</div>}

                  <div className="flex flex-col space-y-3">
                    <Button onClick={handleOtpVerifyAndSignup} className="h-14 text-black bg-lime-400 hover:bg-lime-300 font-black text-lg rounded-2xl transition-all shadow-xl shadow-lime-500/20" disabled={loading || otp.length < 6}>
                      {loading ? 'Finalizing...' : 'VERIFY & CREATE ACCOUNT'}
                    </Button>
                    <button type="button" onClick={() => setOtpStep(false)} className="text-zinc-500 font-bold text-xs hover:text-white transition-colors">
                      BACK TO FORM
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
               <p className="text-[10px] text-zinc-500 font-medium">
                  By creating an account, you agree to our{' '}
                  <button type="button" onClick={() => setLegalModal({ open: true, title: 'Terms', content: <p>Terms content...</p> })} className="text-lime-400 font-bold hover:underline">Terms</button>
                  {' and '}
                  <button type="button" onClick={() => setLegalModal({ open: true, title: 'Privacy', content: <p>Privacy content...</p> })} className="text-lime-400 font-bold hover:underline">Privacy Policy</button>
               </p>
            </div>
          </div>
        </motion.div>

        <LegalModal isOpen={legalModal.open} onClose={() => setLegalModal({ ...legalModal, open: false })} title={legalModal.title} content={legalModal.content} />
      </div>
    </AuthRedirectWrapper>
  );
}
