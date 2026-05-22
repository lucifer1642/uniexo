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
          localStorage.removeItem('uniexo-auth-storage');
          sessionStorage.clear();
        }
      },
      
      updateUser: (updatedUser) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),
    }),
    {
      name: 'uniexo-auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Hydration error:", error);
          return;
        }
        
        if (state) {
          // Check for token expiration
          if (state.token && authClient.isTokenExpired(state.token)) {
            console.warn("[AUTH STORE] Token expired, logging out...");
            state.logout();
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
