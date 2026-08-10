import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTE } from '../theme';

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export const THEME_MODES = {
  light: { label: 'Modern', name: 'Modern' },
  paper: { label: 'Paper', name: 'Paper' },
  dark: { label: 'Dark', name: 'Dark' },
  default: { label: 'Default', name: 'Default' },
};

const STORAGE_KEY_THEME_MODE = 'themeMode';

const getTimeBasedIsDark = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState('default');
  const [isDark, setIsDark] = useState(getTimeBasedIsDark);

  // Load the persisted mode once on mount.
  useEffect(() => {
    const loadMode = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_THEME_MODE);
        if (saved && THEME_MODES[saved]) setThemeModeState(saved);
      } catch (e) {
        console.warn('Failed to load theme mode', e);
      }
    };
    loadMode();
  }, []);

  // Derive isDark from the selected mode. Only 'default' tracks time of
  // day (re-checked hourly) — 'light'/'dark' stay fixed regardless of time,
  // which is what was broken before: the hourly tick used to reset isDark
  // to the time-based value even after a manual light/dark choice.
  useEffect(() => {
    if (themeMode === 'dark') {
      setIsDark(true);
      return;
    }
    if (themeMode === 'light' || themeMode === 'paper') {
      setIsDark(false);
      return;
    }
    setIsDark(getTimeBasedIsDark());
    const interval = setInterval(() => {
      setIsDark(getTimeBasedIsDark());
    }, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [themeMode]);

  const setThemeMode = async (mode) => {
    if (!THEME_MODES[mode]) return;
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME_MODE, mode);
    } catch (e) {
      console.warn('Failed to persist theme mode', e);
    }
  };

  const colors = PALETTE[themeMode] || (isDark ? PALETTE.dark : PALETTE.light);

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
