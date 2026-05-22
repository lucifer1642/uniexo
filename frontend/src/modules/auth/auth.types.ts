export type UserRole = 'user' | 'vendor' | 'admin';
export type AuthProvider = 'email' | 'google';

export interface User {
  id: string; // Supabase UUID
  uniId: string; // UNI-XXXX
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  authProvider: AuthProvider;
  avatar?: string;
  universityId?: string;
  location?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  businessName?: string;
  serviceType?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}
