import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';

// Required for redirect handling on web/standalone apps
WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const { authentication } = response;
        if (authentication?.accessToken) {
          setError(null);
          setGoogleAccessToken(authentication.accessToken);
        } else {
          setError('Failed to retrieve authentication token from Google.');
        }
      } else if (response.type === 'error') {
        setError(response.error?.message || 'Google Authentication failed.');
      } else if (response.type === 'cancel') {
        setError('Google Sign-In was cancelled.');
      }
    }
  }, [response]);

  return {
    promptAsync,
    request,
    response,
    googleAccessToken,
    loading,
    error,
    setGoogleAccessToken,
  };
};
