import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

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

// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  let token = useAuthStore.getState().token;
  
  if (!token && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state && parsed.state.token) {
          token = parsed.state.token;
        }
      }
    } catch (e) {}
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (!original) return Promise.reject(error);

    // ── 401: Handle unauthorized ───
    if (error.response?.status === 401) {
        const { registrationTime, logout } = useAuthStore.getState();
        const url = error.config?.url || 'unknown';
        const backendMessage = (error.response.data as any)?.error || error.message;
        
        // If the session was created recently (last 60s), it might be a Supabase synchronization lag.
        // We give it a generous 1-minute window to stabilize.
        const isNewSession = registrationTime && (Date.now() - registrationTime < 60000);
        
        if (isNewSession) {
            console.warn(`[API] 401 on fresh session for ${url}: "${backendMessage}". Skipping auto-logout during grace period.`);
            return Promise.reject(error);
        }

        console.error(`[API] 401 Unauthorized for ${url}: "${backendMessage}". Logging out user.`);
        logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
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
