import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_PREFIX = '/api/v1';

const normalizeApiBaseURL = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim()?.replace(/\/$/, '');

  if (backendOrigin) {
    return `${backendOrigin}${API_PREFIX}`;
  }

  if (!configured) {
    return API_PREFIX;
  }

  try {
    const url = new URL(configured);
    const isFrontendPreview =
      url.hostname.includes('frontend') && url.hostname.endsWith('.vercel.app');

    if (typeof window !== 'undefined' && isFrontendPreview && url.origin !== window.location.origin) {
      console.warn(
        `[API] Ignoring NEXT_PUBLIC_API_URL=${url.origin}; it looks like a frontend deployment, not the backend.`,
      );
      return API_PREFIX;
    }

    return `${url.origin}${url.pathname.replace(/\/$/, '') || API_PREFIX}`;
  } catch {
    return configured.replace(/\/$/, '');
  }
};

const baseURL = normalizeApiBaseURL();

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

  // ── Smart Rerouting for Vendor Listings (Robust Backend) ──
  const robustRoutes = ['/houses', '/vehicles', '/marketplace', '/laundry'];
  const isBaseRoute = config.url && robustRoutes.includes(config.url);
  const isVendorFetch = config.url?.includes('/vendor/my-');
  
  // Only reroute if it's a base listing route or a specific vendor fetch
  const shouldReroute = (isBaseRoute || isVendorFetch) && !config.url?.startsWith('/robust');
  
  if (shouldReroute) {
    console.log(`[API] Rerouting ${config.url} to Robust Backend...`);
    config.url = `/robust${config.url}`;
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
        const url = error.config?.url || '';
        const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
        
        if (!isAuthRoute) {
            console.warn(`[API] 401 Unauthorized for ${url}. Keeping session but logging warning.`);
            // DO NOT wipe storage or redirect. Let the UI handle it or let user refresh.
            // window.location.href = '/login?error=session_expired';
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
