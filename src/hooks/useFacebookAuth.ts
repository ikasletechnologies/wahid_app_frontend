import { useState } from 'react';
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

export const useFacebookAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithFacebook = async () => {
    setError('Facebook Sign-In is temporarily commented out');
    return null;
  };

  return {
    signInWithFacebook,
    loading,
    error,
  };
};
