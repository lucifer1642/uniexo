'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      useAuthStore.getState().login({
        id: data.profile.id,
        name: data.profile.name,
        email: data.profile.email,
        role: data.profile.role,
        serviceType: data.profile.service_type
      }, data.token);

      toast.success("Access Granted");
      router.push(data.profile.role === 'admin' ? '/admin' : '/dashboard');
      
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-500 text-[10px] font-black uppercase ml-1">Email Address</Label>
              <Input name="email" type="email" required value={formData.email} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white" placeholder="name@domain.com" />
            </div>
            
            <div className="space-y-1">
              <Label className="text-zinc-500 text-[10px] font-black uppercase ml-1">Password</Label>
              <div className="relative">
                <Input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} className="h-12 bg-black border-zinc-800 rounded-xl text-white" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full h-14 bg-lime-500 text-black font-black text-lg rounded-xl transition-all active:scale-95 shadow-xl shadow-lime-500/10 hover:bg-lime-400">
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
