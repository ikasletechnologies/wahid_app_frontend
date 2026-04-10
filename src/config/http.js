import axios from 'axios';
import { API_BASE_URL } from './api';

// Shared Axios instance — pre-configured with base URL, timeout, and auth.
// AuthContext sets the Authorization header once after login:
//   http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
// All screens/contexts import this instead of calling fetch() directly.
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ── Request interceptor ────────────────────────────────────────────────────
http.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────────────────────
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      const status  = error.response?.status ?? 'NO_RESPONSE';
      const url     = error.config?.url ?? '';
      const message = error.response?.data?.message ?? error.message;
      console.warn(`[API ERROR] ${status} ${url} — ${message}`);
    }
    return Promise.reject(error);
  },
);

export default http;
