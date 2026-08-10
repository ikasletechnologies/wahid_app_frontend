/**
 * NetworkStatusBanner
 *
 * Monitors connectivity and RTT (round-trip time) to detect:
 *  - Offline: device has no internet connection
 *  - Slow connection: RTT > 500ms or effective type is 2g/slow-2g
 *
 * Shows a smooth animated banner at the top of the screen.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import Text from './AppText';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../theme';

const BANNER_HEIGHT = 44;

const NetworkStatusBanner = () => {
  const [status, setStatus] = useState(null); // null | 'offline' | 'slow'
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);

  const startPulse = useCallback(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const showBanner = useCallback((newStatus) => {
    setStatus(newStatus);
    startPulse();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [slideAnim, startPulse]);

  const hideBanner = useCallback(() => {
    stopPulse();
    Animated.timing(slideAnim, {
      toValue: -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setStatus(null));
  }, [slideAnim, stopPulse]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected || !state.isInternetReachable) {
        showBanner('offline');
      } else if (
        state.details?.isConnectionExpensive ||
        state.type === 'cellular' &&
        (state.details?.cellularGeneration === '2g' || state.details?.cellularGeneration === null)
      ) {
        showBanner('slow');
      } else {
        hideBanner();
      }
    });

    return () => unsubscribe();
  }, [showBanner, hideBanner]);

  if (status === null) return null;

  const isOffline = status === 'offline';
  const bgColor   = isOffline ? '#c0392b' : '#e67e22';
  const icon      = isOffline ? 'cloud-offline-outline' : 'wifi-outline';
  const message   = isOffline
    ? 'No Internet Connection'
    : 'Slow Connection Detected';
  const subMessage = isOffline
    ? 'Check your Wi-Fi or mobile data'
    : 'Some content may load slowly';

  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bgColor, top: topOffset, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Animated.View style={{ opacity: pulseAnim }}>
        <Ionicons name={icon} size={18} color="#fff" />
      </Animated.View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.sub}>{subMessage}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    minHeight: BANNER_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
    color: '#fff',
    letterSpacing: 0.3,
  },
  sub: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
});

export default NetworkStatusBanner;
