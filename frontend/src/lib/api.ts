import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase';

/**
 * Axios instance for all backend API calls.
 * Tuned for 10k+ concurrent users with:
 * - Cached session tokens (avoids getSession on every request)
 * - Exponential backoff on 5xx/network errors
 */
const isProd = process.env.NODE_ENV === 'production';
const baseURL = isProd
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  
  // Use cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  // Refresh from Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : now + 3600000;
      useAuthStore.setState({ token: session.access_token });
      return cachedToken;
    }
  } catch {
    // Supabase call failed — fall through to zustand
  }

  // Fallback to zustand
  const token = useAuthStore.getState().token;
  return token || null;
}

// Keep token cache in sync with auth state changes
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

// ── Response Interceptor ─────────────────────────────────────────────────────
// Flag to prevent multiple simultaneous redirects
let isRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (!original) return Promise.reject(error);

    // ── 401: Refresh token once, then silently fail (NO hard redirect) ───
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
        // Session is truly dead — clean up state but DON'T do a hard redirect.
        // The component layer (ProtectedRoute, etc.) handles navigation.
        // A hard window.location.href here causes infinite reload loops.
        cachedToken = null;
        tokenExpiresAt = 0;
        const store = useAuthStore.getState();
        if (store.isAuthenticated) {
          store.logout();
          await supabase.auth.signOut();
        }
        // Let the error propagate — React components will handle the redirect
      }
    }

    // ── 5xx or network error: retry with exponential backoff ──────────
    const retryCount = original._retryCount || 0;
    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status < 600);
    
    if (isRetryable && retryCount < 2) {
      original._retryCount = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(original);
    }

    return Promise.reject(error);
  },
);
