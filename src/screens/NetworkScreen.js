import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { FONTS } from '../theme';

const { width } = Dimensions.get('window');

const NetworkScreen = ({ onConnectionRestored }) => {
  const [checking, setChecking] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Rotation animation
  const startSpin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleRetry = async () => {
    if (checking) return;
    setChecking(true);
    startSpin();

    // Enforce 1s animation duration for high quality visual response
    const checkPromise = NetInfo.fetch();
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const [state] = await Promise.all([checkPromise, delayPromise]);
      // isConnected is true, and isInternetReachable is either true or not yet calculated (null)
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      if (isOnline) {
        Toast.show({
          type: 'success',
          text1: 'Connected',
          text2: 'Internet connection is back!',
        });
        if (onConnectionRestored) {
          onConnectionRestored();
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Still Offline',
          text2: 'Please verify your Wi-Fi or cellular network.',
        });
      }
    } catch (error) {
      console.error('[NETWORK CHECK ERROR]', error);
    } finally {
      setChecking(false);
    }
  };

  // Interpolate rotation angle
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Illustration ── */}
      <Image
        source={require('../../assets/network/network.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {/* ── Title ── */}
      <Text style={styles.title}>No internet connection</Text>

      {/* ── Subtitle ── */}
      <Text style={styles.subtitle}>
        Your internet connection is down, please fix it{"\n"}and then you can continue using{' '}
        <Text style={styles.boldBrand}>WAHID</Text>
      </Text>

      {/* ── Retry / Reload Button ── */}
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleRetry}
          style={styles.buttonContainer}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={24} color="#06B6D4" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: width * 0.72,
    height: width * 0.72,
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 36,
  },
  boldBrand: {
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  buttonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderColor: '#EBECF0',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default NetworkScreen;
