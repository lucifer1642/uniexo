'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // REMOVED: Automatic redirect to /login. 
    // We stay on the page even if isAuthenticated is false, 
    // but the UI will handle the state via the return null below.
  }, [isAuthenticated, isClient, router, allowedRoles, user]);

  if (!isClient) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    if (isClient && typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return <>{children}</>;
}
