'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AuthRedirectWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !_hasHydrated) return;

    if (isAuthenticated && user) {
      const path = user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/dashboard' : '/';
      console.log('[AUTH-REDIRECT] Already authenticated, redirecting to:', path);
      router.push(path);
    }
  }, [isAuthenticated, _hasHydrated, isClient, router, user]);

  if (!isClient || !_hasHydrated) {
    return null;
  }

  // Only render children if the user is NOT authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
