import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

/**
 * Axios instance for all backend API calls.
 * Tuned for 10k+ concurrent users with:
 * - Cached session tokens (avoids getSession on every request)
 * - Exponential backoff on 5xx/network errors
 * - Circuit-breaker style retry limit
 */
const isProd = process.env.NODE_ENV === 'production';
const baseURL = isProd
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000, // 20s timeout (serverless cold starts can take a few seconds)
  headers: { 'Content-Type': 'application/json' },
});

// ── Token cache to avoid calling getSession() on every single request ────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  
  // If we have a cached token that's still valid (with 60s buffer), use it
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  // Otherwise, refresh from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    cachedToken = session.access_token;
    tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : now + 3600000;
    useAuthStore.setState({ token: session.access_token });
    return cachedToken;
  }

  // Fallback to zustand
  const token = useAuthStore.getState().token;
  return token || null;
}

// Listen for Supabase auth state changes to keep cache in sync
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      cachedToken = session.access_token;
      tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
    } else {
      cachedToken = null;
      tokenExpiresAt = 0;
    }
  });
}

// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: retry with backoff ─────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (!original) return Promise.reject(error);

    // ── 401: Refresh token once ──────────────────────────
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !session) throw new Error('Refresh failed');

        cachedToken = session.access_token;
        tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
        useAuthStore.setState({ token: session.access_token });
        original.headers.Authorization = `Bearer ${session.access_token}`;
        return api(original);
      } catch {
        cachedToken = null;
        tokenExpiresAt = 0;
        useAuthStore.getState().logout();
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }

    // ── 5xx or network error: retry with exponential backoff ──
    const retryCount = original._retryCount || 0;
    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600);
    
    if (isRetryable && retryCount < 2) {
      original._retryCount = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 4000); // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(original);
    }

    return Promise.reject(error);
  },
);
