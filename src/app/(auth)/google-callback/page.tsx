'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let hasAttempted = false;

    const handleCallback = async () => {
      if (hasAttempted) return;
      hasAttempted = true;

      try {
        console.log('[GOOGLE CALLBACK] Extracting session...');
        // getSession parses the URL hash fragment automatically on mount
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error("No session found in URL.");
        }

        console.log('[GOOGLE CALLBACK] Syncing with server...');
        const res = await fetch('/api/auth/google-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token
          })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to sync Google account");
        }

        // Setup our app state
        const userState: any = {
          id: data.profile.id,
          uniId: data.profile.uniId || '',
          name: data.profile.name,
          email: data.profile.email,
          role: data.profile.role,
          authProvider: 'google',
          serviceType: data.profile.serviceType,
          phone: data.profile.phone,
          kycStatus: data.profile.kycStatus
        };
        
        console.log('[GOOGLE CALLBACK] Success, logging into store...');
        useAuthStore.getState().login(userState, data.token);
        
        if (isMounted) {
          toast.success("Signed in with Google!");
          let redirectPath = '/';
          if (data.profile.role === 'admin') redirectPath = '/admin';
          else if (data.profile.role === 'vendor') redirectPath = '/dashboard';

          window.location.href = redirectPath;
        }
      } catch (err: any) {
        console.error('[GOOGLE CALLBACK] Error:', err);
        if (isMounted) {
          setError(err.message || 'Authentication failed');
          toast.error(err.message || 'Authentication failed. Please try again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      }
    };

    // Listen for auth state changes which happen after the URL hash is parsed
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleCallback();
      }
    });

    // Also attempt immediately in case the session was already parsed and ready
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleCallback();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 p-10 rounded-[3rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] backdrop-blur-xl relative z-10 text-center">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl">
            <p className="font-bold text-lg mb-2">Sign-In Error</p>
            <p className="text-sm mb-4">{error}</p>
            <p className="text-xs opacity-70">Redirecting you back to login...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Securing your session...</h2>
            <p className="text-muted-foreground">Please wait while we sync your Google account with UniExo.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
