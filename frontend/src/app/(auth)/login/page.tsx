'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (user && user.email) {
        const idToken = await user.getIdToken();
        
        // Try direct token login
        let { data, error: authError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        // Fallback for disabled providers
        if (authError && authError.message.includes('not enabled')) {
          const { data: fallbackData, error: fallbackError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: `GOOGLE_BRIDGE_${user.uid}`
          });
          if (fallbackError) throw new Error("No UniExo account linked to this Google ID.");
          data = fallbackData;
        } else if (authError) throw authError;

        if (data.session && data.user) {
          // Fetch profile details
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          
          useAuthStore.getState().login({
            id: data.user.id,
            name: profile?.name || user.displayName || 'User',
            email: data.user.email!,
            role: profile?.role || 'user'
          }, data.session.access_token);

          toast.success("Welcome back!");
          router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;

      if (data.session && data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        useAuthStore.getState().login({
          id: data.user.id,
          name: profile?.name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email!,
          role: profile?.role || 'user'
        }, data.session.access_token);

        toast.success("Access Granted");
        router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] backdrop-blur-xl">
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-lime-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Nexus Login</h1>
        </div>

        <div className="space-y-6">
          <Button onClick={handleGoogleLogin} className="w-full h-14 bg-white text-black font-bold rounded-xl hover:bg-zinc-200">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="G" />
            Sign in with Google
          </Button>

          <div className="text-zinc-700 text-center text-[10px] font-bold uppercase tracking-widest">or manual access</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-500 text-[10px] font-black uppercase ml-1">Email Address</Label>
              <Input name="email" type="email" required value={formData.email} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white" style={{ color: 'white' }} placeholder="name@domain.com" />
            </div>
            
            <div className="space-y-1">
              <Label className="text-zinc-500 text-[10px] font-black uppercase ml-1">Access Key</Label>
              <div className="relative">
                <Input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white" style={{ color: 'white' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full h-14 bg-lime-500 text-black font-black text-lg rounded-xl transition-all active:scale-95 shadow-xl shadow-lime-500/10">
              {loading ? "VERIFYING..." : "ENTER NEXUS"}
            </Button>
          </form>

          <div className="text-center pt-4">
             <Link href="/signup" className="text-zinc-500 text-xs font-bold hover:text-lime-500 transition-colors">
               Apply for New Access (Sign Up)
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
