import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MiniPlayer() {
  const navigation = useNavigation();
  const {
    activeTrack, isPlaying, togglePlay, queueTitle,
    nextTrack, prevTrack, shuffleMode, progress,
    isMiniPlayerVisible, hideMiniPlayer
  } = usePlaylist();
  const { colors, isDark } = useAppTheme();

  const translateX = useRef(new Animated.Value(0)).current;

  // Reset animation when player becomes visible again
  useEffect(() => {
    if (isMiniPlayerVisible) {
      translateX.setValue(0);
    }
  }, [isMiniPlayerVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { dx: translateX }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > SCREEN_WIDTH * 0.4) {
          Animated.timing(translateX, {
            toValue: gesture.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start(() => hideMiniPlayer());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  if (!activeTrack || !isMiniPlayerVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1a1f26' : '#fff',
          borderColor: colors.border,
          transform: [{ translateX }],
          opacity: translateX.interpolate({
            inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            outputRange: [0, 1, 0],
          }),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.touchArea}
        onPress={() => navigation.navigate('NowPlaying')}
        activeOpacity={0.9}
      >
        {/* Progress indicator strip */}
        <View style={[styles.progressStrip, { backgroundColor: colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]}
          />
        </View>

        <View style={styles.card}>
          {/* Playing indicator or icon */}
          <View style={[styles.dot, { backgroundColor: isPlaying ? colors.primary : colors.border }]} />

          <View style={styles.info}>
            <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]} numberOfLines={1}>
              {activeTrack.arabic}  {activeTrack.transliteration}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {queueTitle}{shuffleMode ? '   shuffle' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={(e) => { e.stopPropagation(); prevTrack(); }}
            hitSlop={15}
          >
            <Ionicons name="play-skip-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={(e) => { e.stopPropagation(); togglePlay(); }}
            hitSlop={15}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={(e) => { e.stopPropagation(); nextTrack(); }}
            hitSlop={15}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 95,
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
    overflow: 'hidden',
  },
  touchArea: {
    flex: 1,
  },
  progressStrip: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  info: {
    flex: 1,
    marginRight: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
  },
  btn: {
    marginLeft: 8,
    padding: 6,
  },
});
