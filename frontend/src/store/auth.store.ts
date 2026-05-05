import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'user' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  universityId?: string;
  location?: string;
  idCardPhotoUrl?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  businessName?: string;
  serviceType?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          sessionStorage.clear();
        }
      },
      updateUser: (updatedUser) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updatedUser } : null })),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (_state, error) => {
        useAuthStore.setState({ _hasHydrated: true });
        if (error && process.env.NODE_ENV !== 'production') {
          console.error('[AUTH] Rehydrate error:', error);
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