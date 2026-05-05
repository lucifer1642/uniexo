'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = searchParams.get('token');
      
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword,
          token,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success('Password reset successfully! Please login with your new password.');
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-400 text-sm font-medium ml-1">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            readOnly
            disabled
            className="h-12 bg-white/[0.05] border-white/10 text-zinc-500 rounded-xl cursor-not-allowed"
            value={formData.email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-zinc-300 text-sm font-medium ml-1">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl"
            placeholder="Min 6 characters"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm font-medium ml-1">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 text-black bg-lime-400 hover:bg-lime-300 font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)] active:scale-[0.98]" 
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthRedirectWrapper>
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black selection:bg-lime-500/30 selection:text-lime-200">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -60, 0],
              y: [0, 80, 0],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-[10%] right-[10%] w-[45%] h-[45%] bg-lime-500/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.3, 1, 1.3],
              x: [0, 60, 0],
              y: [0, -80, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-[10%] left-[10%] w-[45%] h-[45%] bg-green-600/10 rounded-full blur-[120px]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md px-4"
        >
          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-white">
              Set New <span className="text-lime-400">Password</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Security first. Choose a strong password.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <Suspense fallback={<div className="text-center py-12 text-lime-400 animate-pulse font-bold">Initializing Reset Flow...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </AuthRedirectWrapper>
  );
}
