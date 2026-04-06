import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const { colors, isDark } = useAppTheme();
  const animation = useRef(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={isDark ? ['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)'] : [colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={styles.topOrb} />
      <View style={styles.bottomOrb} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Lottie animation */}
        <View style={styles.lottieWrap}>
          <LottieView
            ref={animation}
            source={require('../../assets/animation/Bismillah (In the name of Allah).json')}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
            colorFilters={[
              {
                keypath: '**', // Apply to all paths
                color: COLORS.primary,
              },
            ]}
          />
        </View>

        {/* Text section */}
        <View style={styles.textWrap}>
          <View style={[styles.dividerWrap, { opacity: isDark ? 0.6 : 1.0 }]}>
            <View style={[styles.line, { backgroundColor: COLORS.primary }]} />
            <Ionicons name="sparkles" size={12} color={COLORS.primary} />
            <View style={[styles.line, { backgroundColor: COLORS.primary }]} />
          </View>

          <Text style={[styles.arabicTitle, { color: COLORS.primary, textShadowColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>أسماء الله الحسنى</Text>
          <Text style={[styles.englishTitle, { color: colors.textMuted }]}>The 99 Names of Allah</Text>

          <View style={styles.loaderWrap}>
            <View style={[styles.loaderDot, { backgroundColor: colors.borderStrong }]} />
            <View style={[styles.loaderDot, styles.loaderDotActive, { backgroundColor: colors.primary }]} />
            <View style={[styles.loaderDot, { backgroundColor: colors.borderStrong }]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOrb: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(45, 156, 150, 0.05)', // Subtle teal
    filter: 'blur(60px)',
  },
  bottomOrb: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(201, 168, 76, 0.03)', // Subtle gold
    filter: 'blur(60px)',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  lottieWrap: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    alignItems: 'center',
    marginTop: SPACE.xl,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACE.md,
    opacity: 0.6,
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: '#c9a84c',
  },
  arabicTitle: {
    fontFamily: FONTS.arabicBold,
    fontSize: 44,
    color: '#edca66', // Premium Gold
    textAlign: 'center',
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  englishTitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  loaderWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACE.xxl,
  },
  loaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loaderDotActive: {
    backgroundColor: '#c9a84c',
    width: 12,
  }
});

export default SplashScreen;
