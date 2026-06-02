import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64;

// Unique gradient per name number
const ARTWORK_GRADIENTS = [
  ['#0d1f3a', '#1a3d6e', '#0a1528'],
  ['#1a0d3a', '#3a1a6e', '#100828'],
  ['#0d2a1a', '#1a5a37', '#071a10'],
  ['#2a1a0d', '#5a3a1a', '#180e07'],
  ['#2a0d0d', '#5a1a1a', '#180707'],
  ['#0d2a2a', '#1a5555', '#071818'],
  ['#1a1a0d', '#3a3a1a', '#100f07'],
  ['#1d0d2a', '#3d1a5a', '#100818'],
];
const getArtGradient = (num) => ARTWORK_GRADIENTS[(num - 1) % ARTWORK_GRADIENTS.length];

// Estimate speech duration based on word count and speech rate
const estimateDurationMs = (text, rate = 0.85) => {
  const words = text.trim().split(/\s+/).length;
  const wordsPerSec = (rate * 150) / 60;
  return Math.max(6000, (words / wordsPerSec) * 1000);
};

const formatTime = (ms) => {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function NowPlayingScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const {
    activeTrack, activeQueue, currentIdx, queueTitle,
    isPlaying, loopMode, setLoopMode, shuffleMode, toggleShuffle,
    togglePlay, nextTrack, prevTrack,
    favouriteIds, toggleFavourite,
    elapsed, duration, progress,
  } = usePlaylist();

  const translateY     = useRef(new Animated.Value(0)).current;
  const panHandledRef  = useRef(false);

  const isFav = activeTrack ? favouriteIds.has(activeTrack.number) : false;
  const artGradient = activeTrack ? getArtGradient(activeTrack.number) : ['#0d1f3a', '#1a3d6e'];

  // Swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) => Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) {
          translateY.setValue(dy);
          panHandledRef.current = true;
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 0.8) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 220,
            useNativeDriver: true,
          }).start(() => navigation.goBack());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          }).start();
        }
        panHandledRef.current = false;
      },
    }),
  ).current;

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 240,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  }, [navigation, translateY]);

  if (!activeTrack) {
    return (
      <View style={[styles.empty, { backgroundColor: '#000' }]}>
        <Ionicons name="musical-notes" size={48} color="#333" />
        <Text style={{ color: '#555', marginTop: 16 }}>Nothing is playing</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color="#555" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={dismiss} hitSlop={16} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>NOW PLAYING</Text>
            <Text style={styles.topQueue} numberOfLines={1}>{queueTitle}</Text>
          </View>
          <TouchableOpacity hitSlop={16} style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Artwork ── */}
        <View style={styles.artworkWrap}>
          <LinearGradient
            colors={artGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.artwork}
          >
            {/* Subtle ring decorations */}
            <View style={styles.artRing1} />
            <View style={styles.artRing2} />
            <Text style={styles.artArabic}>{activeTrack.arabic}</Text>
            <Text style={styles.artNumber}>
              {String(activeTrack.number).padStart(2, '0')}
            </Text>
          </LinearGradient>
        </View>

        {/* ── Song Info ── */}
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {activeTrack.transliteration}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {activeTrack.meaning}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleFavourite(activeTrack.number)}
            hitSlop={12}
            style={styles.favBtn}
          >
            <Ionicons
              name={isFav ? 'star' : 'star-outline'}
              size={26}
              color={isFav ? '#f4c542' : '#888'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Reflection / Lyrics ── */}
        <View style={styles.lyricsRow}>
          {activeTrack.reflection ? (
            <Text style={styles.lyricsText} numberOfLines={2}>
              {activeTrack.reflection}
            </Text>
          ) : (
            <View style={styles.noLyricsRow}>
              <Text style={styles.noLyrics}>No reflection</Text>
            </View>
          )}
        </View>

        {/* ── Progress Bar ── */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controls}>
          {/* Shuffle */}
          <TouchableOpacity onPress={toggleShuffle} hitSlop={12}>
            <Ionicons
              name="shuffle"
              size={22}
              color={shuffleMode ? '#c9a84c' : '#666'}
            />
          </TouchableOpacity>

          {/* Prev */}
          <TouchableOpacity onPress={prevTrack} hitSlop={12}>
            <Ionicons name="play-skip-back" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.85}>
            <View style={styles.playBtnInner}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={30}
                color="#fff"
                style={isPlaying ? {} : { marginLeft: 3 }}
              />
            </View>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity onPress={nextTrack} hitSlop={12}>
            <Ionicons name="play-skip-forward" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Loop Mode */}
          <TouchableOpacity
            onPress={() => {
              const nextMode = loopMode === 'none' ? 'playlist' : loopMode === 'playlist' ? 'track' : 'none';
              setLoopMode(nextMode);
            }}
            hitSlop={12}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="repeat"
                size={22}
                color={loopMode !== 'none' ? '#c9a84c' : '#666'}
              />
              {loopMode === 'track' && (
                <View style={styles.loopBadge}>
                  <Text style={styles.loopBadgeText}>1</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Queue Indicator ── */}
        <View style={styles.queueRow}>
          <Ionicons name="list" size={16} color="#555" />
          <Text style={styles.queueText}>
            {currentIdx + 1} / {activeQueue.length}
          </Text>
        </View>

      </SafeAreaView>
          </>
        )}
      </TimeBasedBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topLabel: {
    color: '#999',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  topQueue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 180,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Artwork
  artworkWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  artRing1: {
    position: 'absolute',
    width: ARTWORK_SIZE * 0.85,
    height: ARTWORK_SIZE * 0.85,
    borderRadius: ARTWORK_SIZE * 0.425,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  artRing2: {
    position: 'absolute',
    width: ARTWORK_SIZE * 0.6,
    height: ARTWORK_SIZE * 0.6,
    borderRadius: ARTWORK_SIZE * 0.3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  artArabic: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 72,
    fontFamily: 'Amiri-Regular',
    textAlign: 'center',
  },
  artNumber: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 8,
  },
  // Song info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  songArtist: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  favBtn: {
    paddingLeft: 16,
    paddingVertical: 4,
  },
  // Lyrics
  lyricsRow: {
    marginBottom: 22,
    minHeight: 36,
  },
  lyricsText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noLyricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noLyrics: {
    color: '#555',
    fontSize: 13,
  },
  // Progress
  progressSection: {
    marginBottom: 28,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playBtnInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Queue
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  queueText: {
    color: '#555',
    fontSize: 12,
  },
  loopBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#c9a84c',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
