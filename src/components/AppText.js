import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useFontSettings } from '../context/FontSettingsContext';

// Arabic text styles hardcode one of these two font families directly in
// their StyleSheet (see src/theme/index.js FONTS.arabic/arabicBold). These
// act as markers, not fixed fonts — a style using one of them gets routed to
// the user's selected Arabic script style (Indo-Pak / Uthmani / Naskh)
// instead of the English font family picker.
const ARABIC_FONT_FAMILIES = ['NotoNaskhArabic-Regular', 'NotoNaskhArabic-Bold'];

// Drop-in replacement for RN's <Text> that applies the user's selected
// font family/size from Settings. A Text style marked as Arabic follows the
// separate Arabic script style setting instead of the English font choice.
const AppText = ({ style, ...props }) => {
  const { resolveFontFamily, resolveArabicFontFamily, scaleFontSize } = useFontSettings();
  const flatStyle = StyleSheet.flatten(style) || {};
  const isArabicFont = ARABIC_FONT_FAMILIES.includes(flatStyle.fontFamily);

  const resolvedFamily = isArabicFont
    ? resolveArabicFontFamily()
    : resolveFontFamily(flatStyle.fontWeight, flatStyle.fontFamily);

  const overrideStyle = {
    fontFamily: resolvedFamily,
    fontWeight: 'normal',
    fontStyle: 'normal',
  };
  if (typeof flatStyle.fontSize === 'number') {
    overrideStyle.fontSize = scaleFontSize(flatStyle.fontSize);
  }

  return <RNText {...props} style={[style, overrideStyle]} />;
};

export default AppText;
