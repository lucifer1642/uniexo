import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

/**
 * API base (must end with /api/v1 for this client).
 * - Production: set NEXT_PUBLIC_API_URL to the full base, or set BACKEND_URL on Vercel and use same-origin /api/v1 (rewrites in next.config).
 * - Browser: relative /api/v1 when not using a public API URL (goes through Next rewrites if BACKEND_URL is set).
 * - SSR on Vercel: use this deployment’s origin + /api/v1 so rewrites apply; local dev uses the Express server.
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
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

// Request Interceptor to add access token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor for handling token refresh or global errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Do not attempt to refresh if the failure was an auth endpoint
        const authPaths = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/verify-otp'];
        if (authPaths.some(p => originalRequest.url?.includes(p))) {
            return Promise.reject(error);
        }

        // Only attempt refresh on 401 (Unauthorized), NOT on 403 (Forbidden)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Attempt to hit the refresh token endpoint (correct path: /auth/refresh)
                const res = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });

                // If the backend returns a new token in response body
                const newToken = res.data?.data?.accessToken || res.data?.accessToken;
                if (newToken) {
                    // Update the zustand store
                    useAuthStore.setState({ token: newToken });
                    // Update the original request's auth header
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    // Retry the original request
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, log user out
                useAuthStore.getState().logout();
                // Redirect to landing page if on client side
                if (typeof window !== 'undefined') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);
