'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const router = useRouter();
  const { isAuthenticated: storeIsAuth, user: storeUser, _hasHydrated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  
  // Local state to track auth more reliably during hydration transitions
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !_hasHydrated) return;

    // Check store first
    if (storeIsAuth) {
      setIsAuthVerified(true);
    } else {
      // Fallback: Check localStorage directly in case store hasn't finished hydrating
      try {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state && parsed.state.isAuthenticated) {
            console.log('[PROTECTED-ROUTE] Auth verified via localStorage fallback');
            setIsAuthVerified(true);
            return;
          }
        }
      } catch (e) {
        console.error('[PROTECTED-ROUTE] Error reading localStorage fallback:', e);
      }
      
      // If still not verified, redirect
      console.log('[PROTECTED-ROUTE] Not authenticated, redirecting to /login');
      router.push('/login');
    }
  }, [storeIsAuth, _hasHydrated, isClient, router]);

  useEffect(() => {
    if (!isAuthVerified || !storeUser || !allowedRoles) return;

    if (!allowedRoles.includes(storeUser.role)) {
      console.log('[PROTECTED-ROUTE] Role mismatch:', storeUser.role, 'Expected:', allowedRoles);
      router.push('/');
    }
  }, [isAuthVerified, storeUser, allowedRoles, router]);

  // Wait for both client-side mount and hydration/verification
  if (!isClient || !_hasHydrated) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  // If not verified or role doesn't match, return null while the useEffect redirect handles it
  if (!isAuthVerified || (allowedRoles && storeUser && !allowedRoles.includes(storeUser.role))) {
    // Only return null if we are sure we are not auth'd or role is wrong
    // But wait, if we are NOT auth'd, the useEffect will trigger router.push
    return null;
  }

  return <>{children}</>;
}
