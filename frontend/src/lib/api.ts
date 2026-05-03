import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

/**
 * Resolves the API base URL.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL — set this in Vercel/production to your backend full URL
 *    e.g. https://your-backend.railway.app/api/v1
 * 2. On browser with VERCEL_URL (SSR) → use rewrite /api/v1
 * 3. Local dev → http://localhost:5000/api/v1
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) {
    return explicit.endsWith('/api/v1') ? explicit : `${explicit.replace(/\/$/, '')}/api/v1`;
  }

  // Browser-side: use relative path (goes through Next.js rewrites if BACKEND_URL is set)
  if (typeof window !== 'undefined') {
    // If we're on the actual uniexo domain, point directly to the backend
    if (window.location.hostname.includes('uniexo')) {
      // Production: Next.js will rewrite /api/v1 → BACKEND_URL/api/v1 via next.config.ts
      return '/api/v1';
    }
    return '/api/v1';
  }

  // SSR on Vercel
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel}/api/v1`;
  }

  return 'http://localhost:5000/api/v1';
}

const baseURL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request: inject access token ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: handle 401 with token refresh ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never retry auth endpoints
    const authPaths = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/verify-otp'];
    if (authPaths.some((p) => originalRequest.url?.includes(p))) {
      return Promise.reject(error);
    }

    // On 401, attempt token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (newToken) {
          useAuthStore.setState({ token: newToken });
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  },
);
