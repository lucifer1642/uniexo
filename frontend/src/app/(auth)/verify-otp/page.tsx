'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from 'sonner';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const purpose = searchParams.get('purpose') || 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue, purpose }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Invalid or expired OTP');
      }

      // Auto-login after successful verification
      if (data.token && data.profile) {
        useAuthStore.getState().login(data.profile, data.token);
        toast.success('Verified! Logging you in...', { icon: '✅' });
        
        const redirectPath = data.profile.role === 'admin' ? '/admin' 
          : data.profile.role === 'vendor' ? '/dashboard' : '/';
        router.replace(redirectPath);
      } else {
        toast.success('OTP verified!', { icon: '✅' });
        router.push('/login?verified=true');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP sent successfully to your email.', { icon: '📩' });
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black selection:bg-lime-500/30 selection:text-lime-200">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [100, 0, 100], y: [50, 0, 50] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-lime-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [-100, 0, -100], y: [-50, 0, -50] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-green-600/15 rounded-full blur-[120px]"
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
            Verify <span className="text-lime-400">Identity</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            We sent a code to <span className="font-bold text-white/80">{email}</span>
          </p>
        </div>

        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 text-center">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-white/[0.05] border-white/10 text-lime-400 focus:border-lime-500/50 focus:ring-lime-500/20 rounded-xl transition-all"
                />
              ))}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl mb-6"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-black bg-lime-400 hover:bg-lime-300 font-bold rounded-xl transition-all active:scale-[0.98] mb-6"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Complete Verification'}
            </Button>

            <p className="text-sm text-zinc-500">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-lime-500 hover:text-lime-400 transition-colors underline underline-offset-4 decoration-lime-500/30"
              >
                Resend Code
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-lime-400 font-black animate-pulse">Initializing...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
