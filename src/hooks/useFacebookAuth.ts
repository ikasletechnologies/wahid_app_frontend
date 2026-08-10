import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
};

export const useFacebookAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID as string,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri(),
    },
    discovery
  );

  const signInWithFacebook = async () => {
    setError(null);
    if (!request) {
      setError('Facebook sign in is not ready yet');
      return null;
    }
    setLoading(true);
    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        const accessToken =
          result.authentication?.accessToken || result.params?.access_token;
        if (!accessToken) {
          setError('Facebook did not return an access token');
          return null;
        }
        return { accessToken };
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
    signInWithFacebook,
    loading,
    error,
  };
};
