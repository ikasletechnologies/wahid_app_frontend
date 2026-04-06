// Use the live URL from the environment variable or a local IP for development
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:3000';

export const ENDPOINTS = {
  login:    `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  profile:  `${API_BASE_URL}/api/auth/profile`,
  names:    `${API_BASE_URL}/api/names`,
  progress: `${API_BASE_URL}/api/progress`,
  learn:    `${API_BASE_URL}/api/progress/learn`,
};
