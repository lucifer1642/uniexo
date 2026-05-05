'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AuthRedirectWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated: storeIsAuth, user, _hasHydrated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !_hasHydrated) return;

    let authed = storeIsAuth;
    
    // Fallback: Check localStorage directly
    if (!authed) {
        try {
            const stored = localStorage.getItem('auth-storage');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.state && parsed.state.isAuthenticated) {
                    authed = true;
                }
            }
        } catch (e) {}
    }

    if (authed) {
      setIsAuthVerified(true);
      const role = user?.role || 'user';
      const path = role === 'admin' ? '/admin' : role === 'vendor' ? '/dashboard' : '/';
      console.log('[AUTH-REDIRECT] Already authenticated, redirecting to:', path);
      window.location.href = path;
    }
  }, [storeIsAuth, _hasHydrated, isClient, router, user]);

  if (!isClient || !_hasHydrated) {
    return null;
  }

  // Only render children if the user is NOT authenticated
  if (isAuthVerified) {
    return null;
  }

  return <>{children}</>;
}
