'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from 'sonner';
import { UniExoBrand } from '@/components/brand';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      const path = user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/dashboard' : '/';
      window.location.href = path;
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('[LOGIN] Submitting credentials...');
      const res = await fetch(`/api/auth/login?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }

      console.log('[LOGIN] Success, updating store...');
      
      // Update global auth state
      const userState = {
        id: data.profile.id,
        uniId: data.profile.uniId || '',
        name: data.profile.name,
        email: data.profile.email,
        role: data.profile.role,
        authProvider: data.profile.authProvider || 'email',
        serviceType: data.profile.serviceType,
        phone: data.profile.phone,
        kycStatus: data.profile.kycStatus
      };
      
      useAuthStore.getState().login(userState, data.token);

      toast.success("UniExo Access Granted");

      // Determine redirect path
      let redirectPath = '/';
      if (data.profile.role === 'admin') {
        redirectPath = '/admin';
      } else if (data.profile.role === 'vendor') {
        redirectPath = '/dashboard';
      }

      console.log('[LOGIN] Redirecting to:', redirectPath);
      window.location.href = redirectPath;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Invalid credentials");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 sm:p-6 theme-landing relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ y: [0, -50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -left-1/4 sm:left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[80px] sm:blur-[120px] -z-10"
      />
      <motion.div 
        animate={{ y: [0, 60, 0], x: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 -right-1/4 sm:right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-accent/10 rounded-full blur-[100px] sm:blur-[150px] -z-10"
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
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <ShieldCheck className="w-8 h-8 text-primary" />
          </motion.div>
          <UniExoBrand size="lg" className="mb-2 justify-center" />
          <h1 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">Secure Portal Access</h1>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/google-callback`
                    }
                  });
                  if (error) throw error;
                } catch (err: any) {
                  toast.error(err.message || "Failed to initialize Google Login");
                  setLoading(false);
                }
              }}
              className="w-full h-14 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-transparent px-2 text-muted-foreground font-bold uppercase tracking-widest">Or</span></div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-[11px] font-black uppercase tracking-wider ml-1">Email Address</Label>
              <Input 
                name="email" 
                type="email" 
                required 
                disabled={loading}
                value={formData.email} 
                onChange={handleChange} 
                className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 transition-all text-base px-5 shadow-inner" 
                placeholder="vendor@example.com" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-foreground text-[11px] font-black uppercase tracking-wider">Password</Label>
                <Link href="/forgot-password" className="text-[10px] text-primary font-bold hover:underline">Forgot?</Link>
              </div>
              <div className="relative group">
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  disabled={loading}
                  value={formData.password} 
                  onChange={handleChange} 
                  className="h-14 bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 transition-all text-base px-5 shadow-inner" 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                {error}
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
              <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-primary-foreground font-black text-[13px] tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Authenticating..." : "Enter Workspace"} <ArrowRight size={16} />
                </span>
              </Button>
            </motion.div>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface/60 px-2 text-muted-foreground font-bold">New to UniExo?</span>
            </div>
          </div>

          <div className="text-center">
             <Link href="/signup" className="inline-flex items-center justify-center h-12 w-full rounded-2xl bg-secondary/10 text-secondary font-black text-[13px] tracking-widest uppercase hover:bg-secondary/20 transition-all">
               Create Vendor Account
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
