import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
          new Promise(resolve => setTimeout(resolve, 5000)),
        ]);
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          http.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  // ── OTP flow (Twilio Verify) ─────────────────────────────────────────────
  // Step 1: send OTP to phone number
  const sendOTP = async (phone) => {
    try {
      const response = await http.post(ENDPOINTS.sendOtp, { phone });
      if (response.data?.success) {
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed to send OTP.' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Could not send OTP. Check your number and try again.',
      };
    }
  };

  // Step 2: verify OTP → receive JWT + user object
  const verifyOTP = async (phone, code) => {
    try {
      const response = await http.post(ENDPOINTS.verifyOtp, { phone, code });
      const { user: u, token: t } = response.data;
      setUser(u);
      setToken(t);
      http.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        AsyncStorage.setItem('token', t),
      ]);
      return { success: true, isNewUser: response.data?.isNewUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Incorrect code. Please try again.',
      };
    }
  };

  // ── Legacy email/password (kept for admin) ───────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await http.post(ENDPOINTS.login, { email, password });
      const { user: u, token: t } = response.data;
      setUser(u);
      setToken(t);
      http.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        AsyncStorage.setItem('token', t),
      ]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await http.post(ENDPOINTS.register, { name, email, password });
      const { user: u, token: t } = response.data;
      setUser(u);
      setToken(t);
      http.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        AsyncStorage.setItem('token', t),
      ]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
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

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      delete http.defaults.headers.common['Authorization'];
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('names_cache'),
        AsyncStorage.removeItem('progress_cache'),
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOTP, verifyOTP, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
