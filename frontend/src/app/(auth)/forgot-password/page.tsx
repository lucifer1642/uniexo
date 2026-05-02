'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!email) {
        setError('Please enter your email');
        setLoading(false);
        return;
      }

      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
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
              x: [0, 80, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-lime-500/15 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -80, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-green-600/15 rounded-full blur-[100px]"
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
              Reset <span className="text-lime-400">Password</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Remembered it?{' '}
              <Link href="/login" className="font-bold text-lime-400 hover:text-lime-300 transition-colors">
                Go back to login
              </Link>
            </p>
          </div>

          <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 text-sm font-medium ml-1">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl"
                  placeholder="john@uniexo.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Reset OTP'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </AuthRedirectWrapper>
  );
}

