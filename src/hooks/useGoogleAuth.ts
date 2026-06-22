import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] =
    Google.useAuthRequest({
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

      iosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,

      webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const token =
        response.authentication?.accessToken;

      if (token) {
        setGoogleAccessToken(token);
      }
    }

    if (response.type === 'error') {
      setError(
        response.error?.message ||
          'Google Sign In Failed'
      );
    }
  }, [response]);

  return {
    request,
    response,
    promptAsync,
    googleAccessToken,
    error,
  };
};
