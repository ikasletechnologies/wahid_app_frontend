import http from '../../config/http';
import { ENDPOINTS } from '../../config/api';
import { FacebookAuthResponse } from '../../types/auth';

/**
 * Thin utility: exchanges a Facebook OAuth access token for a backend session.
 * Does NOT write to AsyncStorage or SecureStore — that is handled by
 * AuthContext.socialLogin(), which owns all session state.
 *
 * @param facebookAccessToken The access token received from the Facebook OAuth flow
 * @returns Raw backend response (FacebookAuthResponse)
 */
export const loginWithFacebook = async (
  facebookAccessToken: string
): Promise<FacebookAuthResponse> => {
  const response = await http.post(ENDPOINTS.facebook, {
    accessToken: facebookAccessToken,
  });
  return response.data as FacebookAuthResponse;
};

export type { FacebookAuthResponse };
