import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../../config/api';
import { FacebookAuthResponse } from '../../types/auth';

/**
 * Authenticates with the backend API using the Facebook OAuth Access Token.
 * Stores system access and refresh tokens upon successful verification.
 * 
 * @param facebookAccessToken The access token received from Facebook Auth
 * @returns The authentication response from the backend API
 */
export const loginWithFacebook = async (
  facebookAccessToken: string
): Promise<FacebookAuthResponse> => {
  const response = await axios.post(ENDPOINTS.facebook, {
    accessToken: facebookAccessToken,
  });

  const data: FacebookAuthResponse = response.data;

  if (data && data.success) {
    const { token, refreshToken, user } = data;

    // Save tokens under user requested keys (access_token, refresh_token)
    await AsyncStorage.setItem('access_token', token);
    await AsyncStorage.setItem('refresh_token', refreshToken);

    // Save tokens under existing app keys for compatibility
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  return data;
};
export type { FacebookAuthResponse };
