import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS } from './api';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../utils/secureTokenStorage';

// Shared Axios instance
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// ── Request interceptor ────────────────────────────────────────────────────
// Automatically inject the accessToken if available
http.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log(`[API >>] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Response interceptor ───────────────────────────────────────────────────
// Handles automatic token refresh on 401 errors
http.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API <<] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401, we haven't retried yet, and it's NOT an authentication request
    const isAuthRequest = originalRequest?.url && (
      originalRequest.url.includes('/api/auth/login') ||
      originalRequest.url.includes('/api/admin/auth/login') ||
      originalRequest.url.includes('/api/auth/signup') ||
      originalRequest.url.includes('/api/auth/refresh')
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return http(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        console.log('[AUTH] Token expired, attempting refresh...');

        // Use a clean axios instance to avoid infinite loops
        const refreshResponse = await axios.post(ENDPOINTS.refresh, { refreshToken });

        if (refreshResponse.data?.success) {
          const { accessToken } = refreshResponse.data;

          // Save new token
          await setAccessToken(accessToken);

          // Update the original request header and retry
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          console.log('[AUTH] Token refreshed successfully. Retrying request.');
          
          processQueue(null, accessToken);
          return http(originalRequest);
        } else {
            throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.warn('[AUTH] Session expired. Logging out.');
        // Optional: Trigger a logout by clearing storage
        await Promise.all([AsyncStorage.removeItem('user'), clearTokens()]);
        // The app will naturally redirect if AuthContext state is updated via a listener (or manual check)
      } finally {
        isRefreshing = false;
      }
    }

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
