import React from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '../context/ThemeContext';

/**
 * A theme-aware Toast component that adapts its styling
 * based on the current application theme (Light/Dark).
 */
const ThemedToast = () => {
  const { colors, isDark } = useAppTheme();

  const toastConfig = {
    success: ({ text1, text2 }) => (
      <View style={{
        width: '92%',
        alignSelf: 'center',
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(45, 106, 79, 0.2)',
        borderLeftWidth: 6,
        borderLeftColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 12,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: text2 ? 4 : 0 }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
            {text2}
          </Text>
        ) : null}
      </View>
    ),
    info: ({ text1, text2 }) => (
      <View style={{
        width: '92%',
        alignSelf: 'center',
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        borderLeftWidth: 6,
        borderLeftColor: isDark ? '#FFF' : '#666',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: text2 ? 4 : 0 }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
            {text2}
          </Text>
        ) : null}
      </View>
    ),
    error: ({ text1, text2 }) => (
      <View style={{
        width: '95%',
        alignSelf: 'center',
        backgroundColor: isDark ? 'rgba(26, 26, 26, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 68, 68, 0.2)',
        borderLeftWidth: 5,
        borderLeftColor: '#FF4444',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 10,
        elevation: 10,
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <Text style={{ 
          fontSize: 15, 
          fontWeight: '700', 
          color: colors.text, 
          marginBottom: text2 ? 4 : 0,
          letterSpacing: 0.3
        }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ 
            fontSize: 13, 
            color: colors.textMuted,
            lineHeight: 18
          }}>
            {text2}
          </Text>
        ) : null}
      </View>
    )
  };

  return <Toast config={toastConfig} position="top" topOffset={65} />;
};

export default ThemedToast;
