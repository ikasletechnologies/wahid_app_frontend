import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // accessToken
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      const startTime = Date.now();
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('accessToken'),
        ]);
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        // Ensure splash screen shows for at least 2 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);
        setTimeout(() => setLoading(false), remainingTime);
      }
    };
    loadAuth();
  }, []);

  // ── OTP flow (Handled via Twilio Verify backend) ─────────────────────────
  
  const sendOTP = async (phone) => {
    try {
      const response = await http.post(ENDPOINTS.sendOtp, { phone });
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
  
  const signup = async (verificationToken, username, password, name) => {
    try {
      const response = await http.post(ENDPOINTS.signup, { 
        verificationToken, 
        username, 
        password, 
        name 
      });

      const { user: u, accessToken, refreshToken } = response.data;
      
      setUser(u);
      setToken(accessToken);

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        AsyncStorage.setItem('accessToken', accessToken),
        AsyncStorage.setItem('refreshToken', refreshToken),
      ]);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Account creation failed.',
      };
    }
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
        AsyncStorage.setItem('accessToken', accessToken),
        AsyncStorage.setItem('refreshToken', refreshToken),
      ]);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        // Notify backend to revoke token (best effort)
        await http.post(ENDPOINTS.logout, { refreshToken }).catch(() => null);
      }

      setUser(null);
      setToken(null);
      
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('names_cache'),
        AsyncStorage.removeItem('progress_cache'),
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
      sendOTP, 
      verifyOTP, 
      signup, 
      login, 
      updateProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
