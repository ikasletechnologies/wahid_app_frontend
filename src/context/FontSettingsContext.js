import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FontSettingsContext = createContext();

export const useFontSettings = () => useContext(FontSettingsContext);

// English/Latin font families. Times New Roman and Calibri are proprietary
// Microsoft fonts that can't be redistributed, so we ship their open,
// metrically-compatible Google Fonts equivalents (Tinos / Carlito).
export const FONT_FAMILIES = {
  roboto: { label: 'Roboto', regular: 'Roboto_400Regular', bold: 'Roboto_700Bold' },
  times: { label: 'Times New Roman', regular: 'Tinos_400Regular', bold: 'Tinos_700Bold' },
  calibri: { label: 'Calibri', regular: 'Carlito_400Regular', bold: 'Carlito_700Bold' },
};

// Quran script styles. Each one file, no separate bold cut — boldness is
// baked into the design of these display fonts, so the same family name
// covers regular and bold text. Files are loaded in App.js from
// assets/fonts/ (placeholders until the real font files are dropped in).
export const ARABIC_STYLES = {
  indoPak: { label: 'Indo-Pak', family: 'AlQalamQuran' },
  uthmani: { label: 'Uthmani (Madinah)', family: 'KFGQPCUthmanic' },
  naskh: { label: 'Naskh', family: 'AmiriQuran' },
};

// `scale` drives small text (labels, captions); `maxDelta` caps how many
// pixels any single piece of text can grow/shrink by. The cap keeps large
// titles/headers — which already sit close to fixed-size containers like
// headers and image overlays — from overflowing at the bigger sizes.
export const FONT_SIZES = {
  small: { label: 'Small', scale: 0.92, maxDelta: 2 },
  medium: { label: 'Medium', scale: 1, maxDelta: 0 },
  large: { label: 'Large', scale: 1.1, maxDelta: 4 },
  extralarge: { label: 'Extra Large', scale: 1.2, maxDelta: 7 },
};

const STORAGE_KEY_FAMILY = 'appFontFamily';
const STORAGE_KEY_SIZE = 'appFontSize';
const STORAGE_KEY_ARABIC_STYLE = 'appArabicFontStyle';

export const FontSettingsProvider = ({ children }) => {
  const [fontFamily, setFontFamilyState] = useState('roboto');
  const [fontSize, setFontSizeState] = useState('medium');
  const [arabicFontStyle, setArabicFontStyleState] = useState('naskh');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedFamily, savedSize, savedArabicStyle] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_FAMILY),
          AsyncStorage.getItem(STORAGE_KEY_SIZE),
          AsyncStorage.getItem(STORAGE_KEY_ARABIC_STYLE),
        ]);
        if (savedFamily && FONT_FAMILIES[savedFamily]) setFontFamilyState(savedFamily);
        if (savedSize && FONT_SIZES[savedSize]) setFontSizeState(savedSize);
        if (savedArabicStyle && ARABIC_STYLES[savedArabicStyle]) setArabicFontStyleState(savedArabicStyle);
      } catch (e) {
        console.warn('Failed to load font settings', e);
      }
    };
    loadSettings();
  }, []);

  const setFontFamily = async (family) => {
    if (!FONT_FAMILIES[family]) return;
    setFontFamilyState(family);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_FAMILY, family);
    } catch (e) {
      console.warn('Failed to persist font family', e);
    }
  };

  const setArabicFontStyle = async (style) => {
    if (!ARABIC_STYLES[style]) return;
    setArabicFontStyleState(style);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ARABIC_STYLE, style);
    } catch (e) {
      console.warn('Failed to persist Arabic font style', e);
    }
  };

  const setFontSize = async (size) => {
    if (!FONT_SIZES[size]) return;
    setFontSizeState(size);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SIZE, size);
    } catch (e) {
      console.warn('Failed to persist font size', e);
    }
  };

  // Resolves the loaded font-family name for the current selection, picking
  // the bold variant when the style calls for bold weight or a bold font family.
  const resolveFontFamily = (fontWeight, currentFontFamily) => {
    const weightNum = typeof fontWeight === 'string' ? parseInt(fontWeight, 10) : fontWeight;
    const isWeightBold = fontWeight === 'bold' || (Number.isFinite(weightNum) && weightNum >= 600);
    const isFamilyBold = typeof currentFontFamily === 'string' && /bold|700|800|900/i.test(currentFontFamily);
    const isBold = isWeightBold || isFamilyBold;
    const family = FONT_FAMILIES[fontFamily] || FONT_FAMILIES.roboto;
    return isBold ? family.bold : family.regular;
  };

  // Resolves the loaded font-family name for the current Arabic script style.
  const resolveArabicFontFamily = () => {
    const style = ARABIC_STYLES[arabicFontStyle] || ARABIC_STYLES.naskh;
    return style.family;
  };

  const scaleFontSize = (size) => {
    if (typeof size !== 'number') return size;
    const { scale, maxDelta } = FONT_SIZES[fontSize];
    const rawDelta = size * (scale - 1);
    // Clamp the change to +/-maxDelta pixels so large titles don't blow
    // past their layout while small text still visibly grows/shrinks.
    const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), maxDelta);
    return Math.round(size + clampedDelta);
  };

  return (
    <FontSettingsContext.Provider
      value={{
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        arabicFontStyle,
        setArabicFontStyle,
        resolveFontFamily,
        resolveArabicFontFamily,
        scaleFontSize,
      }}
    >
      {children}
    </FontSettingsContext.Provider>
  );
};
