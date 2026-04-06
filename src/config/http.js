import axios from 'axios';
import { API_BASE_URL } from './api';

// Create a shared axios instance for the app
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper to safely stringify objects for logging
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
};

// Request interceptor - logs outgoing requests
http.interceptors.request.use(
  (config) => {
    console.log('[HTTP Request]', `${config.method?.toUpperCase() || 'GET'} ${config.url}`);
    console.log('[Request Headers]', config.headers);
    if (config.params) console.log('[Request Params]', safeStringify(config.params));
    if (config.data) console.log('[Request Body]', safeStringify(config.data));
    return config;
  },
  (error) => {
    console.log('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - logs responses
http.interceptors.response.use(
  (response) => {
    console.log('[HTTP Response]', `${response.status} ${response.config.url}`);
    console.log('[Response Data]', safeStringify(response.data));
    return response;
  },
  (error) => {
    try {
      if (error.response) {
        console.log('[HTTP Response Error]', `${error.response.status} ${error.config?.url}`);
        console.log('[Response Error Data]', safeStringify(error.response.data));
      } else {
        console.log('[HTTP Error]', error.message);
      }
      // Additional helpful debug info
      if (error.config) console.log('[Error Config]', safeStringify({ url: error.config.url, method: error.config.method, headers: error.config.headers, params: error.config.params }));
      if (error.request) console.log('[Error Request]', safeStringify(error.request));
    } catch (logErr) {
      console.log('[HTTP Logging Error]', logErr);
    }
    return Promise.reject(error);
  }
);

export default http;
