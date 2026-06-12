import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTE } from '../theme';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  });

  // Update theme based on time every hour
  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 18 || hour < 6;
      setIsDark(shouldBeDark);
    }, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, []);

  const colors = isDark ? PALETTE.dark : PALETTE.light;
  const toggleTheme = async () => {
    // Simple manual toggle, overrides automatic time-based mode
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem('userThemeOverride', JSON.stringify(newMode));
    } catch (e) {
      console.warn('Failed to persist theme', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
