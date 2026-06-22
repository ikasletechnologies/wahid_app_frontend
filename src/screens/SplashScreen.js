import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SPACE } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const { colors, isDark } = useAppTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const loaderFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entering animation for logo/name
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in the loader slightly after the logo resolves
      Animated.timing(loaderFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>WAHID</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          LEARN • REFLECT • GROW
        </Text>
      </Animated.View>

      <Animated.View style={[styles.loaderContainer, { opacity: loaderFadeAnim }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 110,
    height: 110,
    marginBottom: SPACE.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: SPACE.xs,
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;
