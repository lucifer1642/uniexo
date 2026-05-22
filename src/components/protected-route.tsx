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

    if (!isAuthenticated || !user) {
      console.log('[PROTECTED-ROUTE] Not authenticated, redirecting to /login');
      router.replace('/login');
    }
  }, [isAuthenticated, user, _hasHydrated, isClient, router]);

  useEffect(() => {
    if (!isClient || !_hasHydrated || !isAuthenticated || !user || !allowedRoles) return;

    if (!allowedRoles.includes(user.role)) {
      console.log('[PROTECTED-ROUTE] Role mismatch, redirecting to home');
      router.replace('/');
    }
  }, [isAuthenticated, user, _hasHydrated, isClient, allowedRoles, router]);

  // Loading state
  if (!isClient || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, the useEffect will handle the redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
