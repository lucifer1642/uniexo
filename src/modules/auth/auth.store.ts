import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from './auth.types';
import { authClient } from './auth.client';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
      }),
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('uniexo-auth-storage');
            sessionStorage.clear();
          } catch (e) {
            // Ignore storage errors
          }
        }
      },
      
      updateUser: (updatedUser) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),
    }),
    {
      name: 'uniexo-auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[AUTH STORE] Hydration error:", error);
          // On error, force hydrated so the app doesn't hang
          if (state) state.setHasHydrated(true);
          return;
        }
        
        if (state) {
          try {
            // Check for token expiration
            if (state.token && authClient.isTokenExpired(state.token)) {
              console.warn("[AUTH STORE] Token expired, logging out...");
              state.logout();
            }
          } catch (e) {
            console.error("[AUTH STORE] Token check error, keeping session:", e);
            // Don't logout on error — let the user stay logged in
          }
          state.setHasHydrated(true);
        }
      },
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
