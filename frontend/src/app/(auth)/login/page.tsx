'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, UserRole } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';
import { LegalModal } from '@/components/legal-modal';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [tempToken, setTempToken] = useState<string>('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [legalModal, setLegalModal] = useState<{ open: boolean, title: string, content: React.ReactNode }>({
    open: false,
    title: '',
    content: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!formData.email || !formData.password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // 1. Sign in with Supabase natively
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;
      if (!data.user || !data.session) throw new Error('No user data returned');

      // 2. Build user object for zustand store from Supabase metadata
      const meta = data.user.user_metadata || {};
      const role = (meta.role as UserRole) || 'user';
      const userData = {
        id: data.user.id,
        name: meta.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email!,
        phone: meta.phone,
        role,
        avatar: meta.avatar_url,
      };

      if (role === 'admin' || role === 'vendor') {
        setTempUserData(userData);
        setTempToken(data.session.access_token);
        
        // Immediate UI transition
        setOtpStep(true);
        setLoading(false);
        toast.info('Sending security code...', { icon: '🛡️' });
        
        // Call backend to send OTP in background/parallel to UI
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/send-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        }).then(async (response) => {
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            toast.error(errData.message || 'Failed to deliver OTP. Please try again.');
            setOtpStep(false);
          } else {
            toast.success('Security code delivered to your email', { icon: '📧' });
          }
        }).catch(() => {
          toast.error('Network error while sending OTP');
          setOtpStep(false);
        });
        
        return;
      }

      // 3. Store in zustand and redirect for normal users
      login(userData, data.session.access_token);
      toast.success('Successfully logged in', { icon: '✨' });
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      router.push(redirectUrl || '/');

    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      if (!otpStep) setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Invalid OTP');
      }
      
      login(tempUserData, tempToken);
      toast.success('Successfully logged in', { icon: '✨' });
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      if (redirectUrl) {
         router.push(redirectUrl);
      } else {
         router.push(tempUserData.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRedirectWrapper>
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black selection:bg-lime-500/30 selection:text-lime-200">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-lime-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-green-600/20 rounded-full blur-[120px]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative z-10 w-full max-w-md px-3 md:px-4"
        >
          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
            <h2 className="text-center text-4xl font-black tracking-tighter text-white">
              Welcome <span className="text-lime-400">Back</span>
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              New to UniExo?{' '}
              <Link href="/signup" className="font-bold text-lime-400 hover:text-lime-300 transition-colors">
                Join the network
              </Link>
            </p>
          </div>

          <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10">
            {!otpStep ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300 text-sm font-medium ml-1">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-13 md:h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl text-base"
                    placeholder="john@uniexo.in"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" title="Password" className="text-zinc-300 text-sm font-medium">Password</Label>
                    <Link href="/forgot-password" title="Forgot Password" className="text-xs font-bold text-lime-500 hover:text-lime-400 transition-colors">
                      Reset?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="h-13 md:h-12 pr-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl text-base"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-lime-400 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-lg animate-shake"
                  >
                    {error}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-13 md:h-12 text-black bg-lime-400 hover:bg-lime-300 font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)] active:scale-[0.97] tap-feedback text-base" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                      />
                      Verifying...
                    </span>
                  ) : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleOtpSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-zinc-300 text-sm font-medium ml-1">Enter Verification Code</Label>
                  <p className="text-xs text-zinc-400 ml-1 mb-2">We've sent a code to {formData.email}</p>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="h-13 md:h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl text-center text-xl tracking-widest font-mono"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, ''));
                      setError('');
                    }}
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-lg animate-shake"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpStep(false);
                      setOtp('');
                      setTempUserData(null);
                      setTempToken('');
                    }}
                    className="h-13 md:h-12 flex-1 rounded-xl bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.1]"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full flex-[2] h-13 md:h-12 text-black bg-lime-400 hover:bg-lime-300 font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)] active:scale-[0.97] tap-feedback text-base" 
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                        />
                      </span>
                    ) : 'Verify & Login'}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-6">
               <button 
                type="button"
                onClick={() => setLegalModal({
                  open: true,
                  title: 'Privacy Policy',
                  content: (
                    <div className="space-y-4">
                      <p>At UniExo, your privacy is our priority. We collect minimal data to ensure a smooth rental experience.</p>
                      <h4 className="font-bold text-white">Data Collection</h4>
                      <p>We collect your email, name, and contact details for verification and booking purposes.</p>
                      <h4 className="font-bold text-white">Security</h4>
                      <p>All data is encrypted and stored securely on our protected servers.</p>
                    </div>
                  )
                })}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-lime-400 transition-colors"
               >
                 Privacy
               </button>
               <div className="w-1 h-1 bg-zinc-800 rounded-full" />
               <button 
                type="button"
                onClick={() => setLegalModal({
                  open: true,
                  title: 'Terms of Service',
                  content: (
                    <div className="space-y-4">
                      <p>By using UniExo, you agree to our community guidelines and rental policies.</p>
                      <h4 className="font-bold text-white">Rentals</h4>
                      <p>Users must provide valid ID for KYC verification before renting assets.</p>
                      <h4 className="font-bold text-white">Payments</h4>
                      <p>All transactions are processed through secure gateways. Platform fees may apply.</p>
                    </div>
                  )
                })}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-lime-400 transition-colors"
               >
                 Terms
               </button>
            </div>
          </div>
        </motion.div>

        <LegalModal 
          isOpen={legalModal.open} 
          onClose={() => setLegalModal({ ...legalModal, open: false })} 
          title={legalModal.title}
          content={legalModal.content}
        />
      </div>
    </AuthRedirectWrapper>
  );
}
