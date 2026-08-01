import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useFontSettings } from '../context/FontSettingsContext';

// Arabic text styles hardcode one of these two font families directly in
// their StyleSheet (see src/theme/index.js FONTS.arabic/arabicBold). Any
// other fontFamily set on a style is just the app's default English font
// (e.g. FONTS.regular/medium/bold = 'Inter-*') and should still be
// overridden by the user's selection, not treated as a fixed override.
const ARABIC_FONT_FAMILIES = ['NotoNaskhArabic-Regular', 'NotoNaskhArabic-Bold'];

// Drop-in replacement for RN's <Text> that applies the user's selected
// font family/size from Settings. A Text style that already sets its own
// Arabic fontFamily is left untouched — this is what keeps Arabic text on
// its dedicated font while everything else follows the global English
// font choice.
const AppText = ({ style, ...props }) => {
  const { resolveFontFamily, scaleFontSize } = useFontSettings();
  const flatStyle = StyleSheet.flatten(style) || {};
  const isArabicFont = ARABIC_FONT_FAMILIES.includes(flatStyle.fontFamily);

  const resolvedFamily = isArabicFont
    ? flatStyle.fontFamily
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
