import { useState } from 'react';
// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin';

export const useGoogleAuth = () => {
  const [googleAccessToken, setGoogleAccessToken] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const signInWithGoogle = async () => {
    setError('Google Sign-In is temporarily commented out');
    return null;
  };

  return {
    signInWithGoogle,
    googleAccessToken,
    loading,
    error,
  };
};
