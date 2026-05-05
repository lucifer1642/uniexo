'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !_hasHydrated) return;

    if (!isAuthenticated) {
      console.log('[PROTECTED-ROUTE] Not authenticated, redirecting to /login');
      router.push('/login');
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      console.log('[PROTECTED-ROUTE] Role mismatch, redirecting to /');
      router.push('/');
    }
  }, [isAuthenticated, _hasHydrated, isClient, router, allowedRoles, user]);

  // Wait for both client-side mount and hydration from localStorage
  if (!isClient || !_hasHydrated) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  // If not authenticated or role doesn't match, return null while the useEffect redirect handles it
  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
