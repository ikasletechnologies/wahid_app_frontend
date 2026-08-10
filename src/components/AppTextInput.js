import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { useFontSettings } from '../context/FontSettingsContext';

// TextInput has no separate "placeholder font" — RN renders both typed
// text and the placeholder using the same style, so overriding fontFamily
// here fixes both at once. Mirrors AppText's Arabic-style routing.
const ARABIC_FONT_FAMILIES = ['NotoNaskhArabic-Regular', 'NotoNaskhArabic-Bold'];

const AppTextInput = ({ style, ...props }) => {
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

  return <RNTextInput {...props} style={[style, overrideStyle]} />;
};

export default AppTextInput;
