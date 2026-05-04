"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types';
import AuthRedirectWrapper from '@/components/auth/AuthRedirectWrapper';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
        
        const isProd = process.env.NODE_ENV === 'production';
        const apiUrl = isProd ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');
        
        console.log('Fetching OTP from:', `${apiUrl}/auth/send-login-otp`);
        // Call backend to send OTP in background/parallel to UI
        fetch(`${apiUrl}/auth/send-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: formData.email })
        }).then(async (response) => {
          console.log('OTP Response Status:', response.status);
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('OTP Error Data:', errData);
            toast.error(errData.message || 'Failed to deliver OTP. Please try again.');
            setOtpStep(false);
          } else {
            toast.success('Security code delivered to your email', { icon: '📧' });
          }
        }).catch((err) => {
          console.error('OTP Fetch Error:', err);
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
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const apiUrl = isProd ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');
      
      const response = await fetch(`${apiUrl}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 backdrop-blur-3xl border border-zinc-800/50 p-8 rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="text-center mb-10">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-white tracking-tighter mb-2"
              >
                {otpStep ? 'VERIFY IDENTITY' : 'WELCOME BACK'}
              </motion.h1>
              <p className="text-zinc-500 text-sm font-medium">
                {otpStep ? `Enter the 6-digit code sent to ${formData.email}` : 'Secure access to the UniExo Nexus'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!otpStep ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@university.edu"
                      className="w-full bg-black/40 border border-zinc-800 focus:border-lime-500/50 focus:ring-4 focus:ring-lime-500/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Access Key (Password)</label>
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-zinc-800 focus:border-lime-500/50 focus:ring-4 focus:ring-lime-500/10 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 transition-all outline-none"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    disabled={loading}
                    className="w-full relative group mt-6"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-lime-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative w-full bg-lime-500 disabled:bg-zinc-800 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-2">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>INITIALIZE SESSION</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="pt-4 text-center">
                    <p className="text-zinc-600 text-xs font-medium">
                      Don't have clearance? <button type="button" onClick={() => router.push('/signup')} className="text-lime-500 font-bold hover:underline">Apply for ID</button>
                    </p>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOtpVerify}
                  className="space-y-6"
                >
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

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <button
                      disabled={loading || otp.length < 6}
                      className="w-full bg-lime-500 disabled:bg-zinc-800 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all transform active:scale-95 flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "VALIDATE PROTOCOL"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="w-full text-zinc-500 font-bold text-xs hover:text-white transition-colors"
                    >
                      ABORT & RETURN
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="mt-8 text-center text-[10px] text-zinc-700 font-bold tracking-[0.2em] uppercase">
            Encrypted End-to-End • UniExo Secure Gateway v4.0
          </p>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
}
