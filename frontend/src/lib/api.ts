import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

/**
 * Axios instance for all backend API calls.
 *
 * Production: /api/v1 (Next.js rewrites proxy to backend)
 * Local dev:  http://localhost:5000/api/v1
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

// ── Request Interceptor: inject Supabase access token ────────────────────────
api.interceptors.request.use(async (config) => {
  // First try to get a fresh token from the Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
    // Keep zustand in sync
    useAuthStore.setState({ token: session.access_token });
  } else {
    // Fallback to zustand stored token
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: on 401, refresh once then logout ───────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
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
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
