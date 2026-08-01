import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  const signInWithGoogle = async () => {
    setError(null);
    if (!request) {
      setError('Google sign in is not ready yet');
      return null;
    }
    setLoading(true);
    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        const accessToken = result.authentication?.accessToken;
        if (!accessToken) {
          setError('Google did not return an access token');
          return null;
        }
        setGoogleAccessToken(accessToken);
        return { accessToken, idToken: result.authentication?.idToken ?? null };
      }
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setError('User cancelled the login flow');
      } else if (result.type === 'error') {
        setError(result.error?.description || 'Something went wrong');
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
