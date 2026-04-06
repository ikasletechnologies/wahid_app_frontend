import Constants from 'expo-constants';

// Detect the local IP of the dev machine to allow mobile app to connect seamlessly
const getLocalIp = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.0.2.2:3000'; // Default Android emulator fallback
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getLocalIp();

export const ENDPOINTS = {
  login:    `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  profile:  `${API_BASE_URL}/api/auth/profile`,
  names:    `${API_BASE_URL}/api/names`,
  progress: `${API_BASE_URL}/api/progress`,
  learn:    `${API_BASE_URL}/api/progress/learn`,
};
