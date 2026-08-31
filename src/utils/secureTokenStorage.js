import * as SecureStore from 'expo-secure-store';

// Access/refresh tokens must never live in AsyncStorage (unencrypted on both
// platforms) — this wraps the Keychain (iOS) / Keystore-backed (Android)
// SecureStore so the rest of the app has a single place tokens pass through.
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const setAccessToken = (token) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
export const setRefreshToken = (token) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);

export const setTokens = async (accessToken, refreshToken) => {
  await Promise.all([setAccessToken(accessToken), setRefreshToken(refreshToken)]);
};

export const clearTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
};
