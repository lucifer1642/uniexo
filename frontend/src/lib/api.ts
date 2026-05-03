import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

/**
 * All API calls go to /api/v1 (relative).
 * On Vercel: Next.js route at /api/v1/[...path]/route.ts proxies to BACKEND_URL.
 * Locally: NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 bypasses the proxy.
 */
const isProd = process.env.NODE_ENV === 'production';
const baseURL = isProd 
  ? '/api/v1' 
  : (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try refresh once then logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/verify-otp']
      .some((p) => original?.url?.includes(p));

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !session) throw new Error('Refresh failed');
        
        const newToken = session.access_token;
        useAuthStore.setState({ token: newToken });
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
