import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../../config/api';
import { FacebookAuthResponse } from '../../types/auth';
import { setTokens } from '../../utils/secureTokenStorage';

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

    await setTokens(token, refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  return data;
};
export type { FacebookAuthResponse };
