import { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo && 'type' in userInfo) {
        if (userInfo.type === 'cancelled') {
          setError('User cancelled the login flow');
          setLoading(false);
          return null;
        }
        if (userInfo.type !== 'success') {
          setError('Sign in was not successful');
          setLoading(false);
          return null;
        }
      }

      const tokens = await GoogleSignin.getTokens();
      setGoogleAccessToken(tokens.accessToken);
      setLoading(false);
      
      let idToken = null;
      if (userInfo && 'data' in userInfo && userInfo.data) {
        idToken = userInfo.data.idToken;
      } else if (userInfo) {
        idToken = (userInfo as any).idToken;
      }

      return { accessToken: tokens.accessToken, idToken };
    } catch (err: any) {
      setLoading(false);
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('User cancelled the login flow');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign in is in progress already');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play services not available or outdated');
      } else {
        setError(err.message || 'Something went wrong');
      }
      return null;
    }
  };

  return {
    signInWithGoogle,
    googleAccessToken,
    loading,
    error,
  };
};
