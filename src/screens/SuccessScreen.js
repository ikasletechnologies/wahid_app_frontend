import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  StatusBar, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SuccessScreen = ({ route }) => {
  const { user, accessToken, refreshToken } = route.params;
  const { completeLogin } = useAuth();

  // Entrance animations
  const badgeScale   = useRef(new Animated.Value(0.4)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Badge pops in
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Button fades in
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    await completeLogin(user, accessToken, refreshToken);
    // AppNavigator automatically switches to authenticated flow
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#02889D', '#041518', '#000000']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative star dots */}
      {STARS.map((s, i) => (
        <View
          key={i}
          style={[styles.star, { top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.opacity }]}
        />
      ))}

      {/* Badge */}
      <Animated.View style={[styles.badgeWrap, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
        <Image
          source={require('../../assets/success/success.png')}
          style={styles.badge}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.title}>You're all Set</Text>
        <Text style={styles.subtitle}>Let you explore the course now!</Text>
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles.btnWrap, { opacity: btnOpacity }]}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.85}>
          <LinearGradient
            colors={['#02889D', '#03B7CE', '#4BD5E8']}
            locations={[0, 0.5048, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue to the course</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Static decorative star positions
const STARS = [
  { top: height * 0.1,  left: width * 0.08,  size: 5, opacity: 0.6 },
  { top: height * 0.14, left: width * 0.82,  size: 4, opacity: 0.5 },
  { top: height * 0.22, left: width * 0.15,  size: 3, opacity: 0.4 },
  { top: height * 0.28, left: width * 0.75,  size: 6, opacity: 0.5 },
  { top: height * 0.35, left: width * 0.05,  size: 4, opacity: 0.35 },
  { top: height * 0.18, left: width * 0.55,  size: 3, opacity: 0.45 },
  { top: height * 0.42, left: width * 0.88,  size: 5, opacity: 0.4 },
  { top: height * 0.08, left: width * 0.45,  size: 4, opacity: 0.5 },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  star: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#4BD5E8',
  },

  badgeWrap: {
    marginBottom: 36,
  },
  badge: {
    width: width * 0.52,
    height: width * 0.52,
  },

  textWrap: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A9A9D',
    textAlign: 'center',
  },

  btnWrap: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  button: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#FDFEFE',
    elevation: 6,
    shadowColor: '#4BD5E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default SuccessScreen;
