import { useState } from 'react';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

export const useFacebookAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithFacebook = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) {
        setError('User cancelled the login flow');
        setLoading(false);
        return null;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        setError('Something went wrong obtaining access token');
        setLoading(false);
        return null;
      }
      setLoading(false);
      return { accessToken: data.accessToken.toString() };
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      return null;
    }
  };

  return {
    signInWithFacebook,
    loading,
    error,
  };
};
