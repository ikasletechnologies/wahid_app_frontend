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
    try {
      setLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices();

      await GoogleSignin.signIn();

      const tokens =
        await GoogleSignin.getTokens();

      setGoogleAccessToken(
        tokens.accessToken
      );

      return {
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      if (
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        setError('Sign in cancelled');
      } else {
        setError(
          error.message || 'Google Sign-In failed'
        );
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    googleAccessToken,
    loading,
    error,
  };
};
