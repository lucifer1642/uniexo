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
      const path =
        user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/dashboard' : '/';

      router.replace(path);
    }
  }, [isAuthenticated, user, _hasHydrated, isClient, router]);

  if (!isClient || !_hasHydrated) {
    return null;
  }

  if (isAuthenticated && user) {
    return null;
  }

  return <>{children}</>;
}
