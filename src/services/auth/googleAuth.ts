import http from '../../config/http';
import { ENDPOINTS } from '../../config/api';
import { GoogleAuthResponse } from '../../types/auth';

/**
 * Thin utility: exchanges a Google OAuth access token for a backend session.
 * Does NOT write to AsyncStorage or SecureStore — that is handled by
 * AuthContext.socialLogin(), which owns all session state.
 *
 * @param googleAccessToken The access token received from the Google OAuth flow
 * @returns Raw backend response (GoogleAuthResponse)
 */
export const authenticateWithGoogle = async (
  googleAccessToken: string
): Promise<GoogleAuthResponse> => {
  const response = await http.post(ENDPOINTS.google, {
    accessToken: googleAccessToken,
  });
  return response.data as GoogleAuthResponse;
};

export type { GoogleAuthResponse };
