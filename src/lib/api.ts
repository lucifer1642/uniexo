import axios from 'axios';

/**
 * API client for the Next.js API routes.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 15000,
});

// Request interceptor to automatically inject Authorization headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('uniexo-auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (err) {
        console.error('[API Axios Interceptor Error]', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

