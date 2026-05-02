import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// We use the backend URL configured in `.env.local` or default to localhost:5000
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
