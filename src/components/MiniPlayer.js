import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';

export default function MiniPlayer() {
  const navigation = useNavigation();
  const { activeTrack, isPlaying, togglePlay, queueTitle, nextTrack, shuffleMode, progress } = usePlaylist();
  const { colors, isDark } = useAppTheme();

  if (!activeTrack) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1a1f26' : '#fff', borderColor: colors.border },
      ]}
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
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
  btn: {
    marginLeft: 12,
    padding: 4,
  },
});
