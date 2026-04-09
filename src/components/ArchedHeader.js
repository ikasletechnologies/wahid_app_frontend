import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SPACE } from '../theme';

const { width } = Dimensions.get('window');

const ArchedHeader = ({ title, subtitle }) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Curved background using a large circle with negative margin */}
      <View style={styles.arcWrapper}>
        <LinearGradient
          colors={[colors.primary, isDark ? '#8a6d1e' : '#B8963D']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >

           <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
           </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  arcWrapper: {
    height: '100%',
    width: '100%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACE.xl,
  },
  content: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ArchedHeader;
