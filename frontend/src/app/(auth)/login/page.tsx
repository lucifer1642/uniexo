'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { AuthRedirectWrapper } from '@/components/auth-redirect-wrapper';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const response = await api.post('/auth/login', formData);
      const { user, accessToken } = response.data.data;

      login(user, accessToken);
      toast.success('Successfully logged in', { icon: '✨' });
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      router.push(redirectUrl || '/');

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md px-4"
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

          <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-3xl p-8 sm:p-10">
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 bg-white/[0.05] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50 focus:ring-lime-500/20 transition-all rounded-xl"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-black bg-lime-400 hover:bg-lime-300 font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(163,230,53,0.5)] active:scale-[0.98]" 
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
          </div>
        </motion.div>
      </div>
    </AuthRedirectWrapper>
  );
}


