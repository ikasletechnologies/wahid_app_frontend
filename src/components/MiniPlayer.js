import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';

export default function MiniPlayer() {
  const { activeTrack, isPlaying, togglePlay, queueTitle, nextTrack } = usePlaylist();
  const { colors, isDark } = useAppTheme();

  if (!activeTrack) return null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1f26' : '#fff', borderColor: colors.border }]}>
      <View style={styles.card}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]} numberOfLines={1}>
            {activeTrack.arabic} • {activeTrack.transliteration}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {queueTitle}
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={togglePlay} hitSlop={15}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={26} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btn} onPress={nextTrack} hitSlop={15}>
          <Ionicons name="play-skip-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 95, // Above TabNavigator
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  btn: {
    marginLeft: 16,
    padding: 4,
  },
});
