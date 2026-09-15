import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/secureTokenStorage';
import { getAndroidAppHash } from '../utils/otpAutofill';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // accessToken
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAuth = async () => {
      const startTime = Date.now();
      const safetyTimer = setTimeout(() => {
        if (isMounted) setLoading(false);
      }, 2500);

      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          getAccessToken(),
        ]);
        if (savedUser && savedToken && isMounted) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        clearTimeout(safetyTimer);
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 800 - elapsedTime);
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, remainingTime);
      }
    };
    loadAuth();
    return () => { isMounted = false; };
  }, []);

  // ── OTP flow (Handled via Twilio Verify backend) ─────────────────────────

  const checkPhone = async (phone) => {
    try {
      const response = await http.post(ENDPOINTS.checkPhone, { phone });
      return { success: true, exists: response.data?.exists ?? false };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, exists: false };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Could not verify phone number. Please try again.',
      };
    }
  };

  const sendOTP = async (phone) => {
    try {
      // On Android, tell Twilio which app-signature hash to append to the SMS body
      // so the OS/SMS Retriever API can auto-detect and auto-fill the code. No-op
      // (resolves to null) on iOS, where autofill works entirely via the keyboard.
      const appHash = await getAndroidAppHash();
      const response = await http.post(ENDPOINTS.sendOtp, { phone, ...(appHash ? { appHash } : {}) });
      return { success: response.data?.success };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP.',
      };
    }
  };

  const verifyOTP = async (phone, code) => {
    try {
      const response = await http.post(ENDPOINTS.verifyOtp, { phone, code });
      // Returns verificationToken (short-lived) and user existence status
      return { 
        success: true, 
        isNewUser: response.data?.isNewUser,
        verificationToken: response.data?.verificationToken,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed.',
      };
    }
  };

  // ── Signup (Collect Credentials after Phone is verified) ─────────────────
  
  const signup = async (verificationToken, username, password, name, gender, dob, email) => {
    try {
      const response = await http.post(ENDPOINTS.signup, {
        verificationToken,
        username,
        password,
        name,
        ...(gender && { gender }),
        ...(dob    && { dob }),
        ...(email  && { email }),
      });

      const { user: u, accessToken, refreshToken } = response.data;

      // Return credentials without setting state yet — caller navigates to
      // SuccessScreen first, then calls completeLogin() to finalize auth.
      return { success: true, user: u, accessToken, refreshToken };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Account creation failed.',
      };
    }
  };

  // Called from SuccessScreen after user taps "Continue to the course"
  const completeLogin = async (userData, accessToken, refreshToken) => {
    setUser(userData);
    setToken(accessToken);
    await Promise.all([
      AsyncStorage.setItem('user', JSON.stringify(userData)),
      setTokens(accessToken, refreshToken),
    ]);
  };

  // ── Standard Login (Identifier + Password) ──────────────────────────────
  
  const login = async (identifier, password) => {
    try {
      const response = await http.post(ENDPOINTS.login, { identifier, password });
      const { user: u, accessToken, refreshToken } = response.data;
      
      setUser(u);
      setToken(accessToken);

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        setTokens(accessToken, refreshToken),
      ]);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // ── Social Login (Google / Facebook) ────────────────────────────────────
  // provider: 'google' | 'facebook'
  // providerToken: the access token returned by the provider SDK
  //
  // Returns:
  //   { success: true }                         — authenticated & state committed
  //   { success: false, cancelled: true }        — user dismissed the provider UI
  //   { success: false, conflict: true, message} — 409 ACCOUNT_LINK_REQUIRED
  //   { success: false, message }               — any other backend / network error

  const socialLogin = async (provider, providerToken) => {
    // Cancelled before we even reached the backend
    if (!providerToken) {
      return { success: false, cancelled: true };
    }

    const endpoint = provider === 'google' ? ENDPOINTS.google : ENDPOINTS.facebook;

    try {
      const response = await http.post(endpoint, { accessToken: providerToken });
      const { user: u, accessToken, refreshToken } = response.data;

      setUser(u);
      setToken(accessToken);

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        setTokens(accessToken, refreshToken),
      ]);

      return { success: true };
    } catch (error) {
      if (error.response?.status === 409) {
        // The email already belongs to a different provider — surface this
        // distinctly so the UI can offer a helpful resolution message.
        return {
          success: false,
          conflict: true,
          message:
            error.response?.data?.message ||
            'An account already exists with this email. Please sign in with your original method.',
        };
      }
      return {
        success: false,
        message:
          error.response?.data?.message ||
          `${provider === 'google' ? 'Google' : 'Facebook'} sign-in failed. Please try again.`,
      };
    }
  };

  const resetPassword = async (verificationToken, newPassword) => {
    try {
      await http.post(ENDPOINTS.resetPassword, { verificationToken, newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed.',
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        // Notify backend to revoke token (best effort)
        await http.post(ENDPOINTS.logout, { refreshToken }).catch(() => null);
      }

      setUser(null);
      setToken(null);

      // Clear every locally-cached per-account key so the next login on this
      // device (a different account, or the same one) never inherits stale
      // Names/Draft/reading-progress state. 'names_cache' (no suffix) was the
      // old cache key name — kept here only so any legacy install still gets
      // it cleaned up; the live cache key is 'names_cache_v14'.
      const staticKeys = [
        'user',
        'names_cache',
        'names_cache_v14',
        'progress_cache',
        'streak_details_cache',
        'draft_ids_v1',
        'review_later_ids_v1',
        'viewed_name_ids',
        'ever_read_card_ids_v1',
        'draft_seeded_v1',
        'last_reading_progress',
      ];
      const allKeys = await AsyncStorage.getAllKeys().catch(() => []);
      const dynamicKeys = allKeys.filter(
        (k) => k.startsWith('reading_time_') || k.startsWith('draft_progress_')
      );

      await Promise.all([
        AsyncStorage.multiRemove([...staticKeys, ...dynamicKeys]),
        clearTokens(),
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await http.put(ENDPOINTS.profile, updates);
      const updatedUser = response.data?.user || { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed',
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      checkPhone,
      sendOTP,
      verifyOTP,
      signup,
      completeLogin,
      login,
      socialLogin,
      resetPassword,
      updateProfile,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
