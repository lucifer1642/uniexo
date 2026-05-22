/**
 * Re-export from the new Auth module for backward compatibility.
 * All existing imports of '@/store/auth.store' continue to work.
 */
export { useAuthStore } from '@/modules/auth/auth.store';
export type { User, UserRole, AuthState } from '@/modules/auth/auth.types';
