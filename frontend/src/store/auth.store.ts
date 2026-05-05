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
  registrationTime: number | null;
  setHasHydrated: (state: boolean) => void;
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
      registrationTime: null,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
        registrationTime: Date.now()
      }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, registrationTime: null });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
        registrationTime: s.registrationTime,
      }),
    },
  ),
);
