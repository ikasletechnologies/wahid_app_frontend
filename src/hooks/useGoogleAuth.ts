import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const auth = response.authentication;

      if (auth?.accessToken) {
        setGoogleAccessToken(auth.accessToken);
        setError(null);
      } else {
        setError('Google access token not received.');
      }
    }

    if (response.type === 'error') {
      setError(
        response.error?.message ||
          'Google authentication failed.'
      );
    }

    if (response.type === 'cancel') {
      setError('Google Sign-In cancelled.');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await promptAsync();

      return result;
    } catch (err: any) {
      setError(
        err?.message || 'Failed to launch Google Sign-In.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    request,
    response,
    googleAccessToken,
    loading,
    error,
    signInWithGoogle,
    promptAsync: signInWithGoogle,
    setGoogleAccessToken,
  };
};
