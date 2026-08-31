import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../../config/api';
import { GoogleAuthResponse } from '../../types/auth';
import { setTokens } from '../../utils/secureTokenStorage';

/**
 * Authenticates with the backend API using the Google OAuth Access Token.
 * Stores system access and refresh tokens upon successful verification.
 * 
 * @param googleAccessToken The access token received from Google Auth
 * @returns The authentication response from the backend API
 */
export const authenticateWithGoogle = async (
  googleAccessToken: string
): Promise<GoogleAuthResponse> => {
  const response = await axios.post(ENDPOINTS.google, {
    accessToken: googleAccessToken,
  });

  const data: GoogleAuthResponse = response.data;

  if (data && data.success) {
    const { token, refreshToken, user } = data;

    await setTokens(token, refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  return data;
};
export type { GoogleAuthResponse };
