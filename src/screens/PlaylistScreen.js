import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNames, MOODS } from '../context/NamesContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const PlaylistScreen = ({ navigation }) => {
  const { names: allNames, getMoodPlaylist, loading } = useNames();
  // Use first MOODS item as default so it matches the chips
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);

  const playlist = useMemo(() => {
    return getMoodPlaylist(selectedMood);
  }, [selectedMood, getMoodPlaylist]);

  const renderPlaylistItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => navigation.navigate('NameDetail', { name: item })}
    >
      <View style={styles.itemIndex}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemArabic}>{item.arabic}</Text>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemTrans}>{item.transliteration}</Text>
          <Text style={styles.itemMeaning} numberOfLines={1}>{item.meaning}</Text>
        </View>
      </View>

      <View style={styles.itemCategory}>
        <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Discover names for your soul's state</Text>
        </View>

        {/* Mood Chips */}
        <View style={styles.moodContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScroll}
          >
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[styles.moodChip, selectedMood === mood && styles.moodChipActive]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={[styles.moodText, selectedMood === mood && styles.moodTextActive]}>
                  {mood.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Playlist List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#c9a84c" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={playlist}
            renderItem={renderPlaylistItem}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() =>
              playlist.length > 0 ? (
                <Text style={styles.resultCount}>
                  {playlist.length} NAME{playlist.length !== 1 ? 'S' : ''} FOR "{selectedMood.toUpperCase()}"
                </Text>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={48} color={COLORS.dimmed} />
                <Text style={styles.emptyText}>
                  {allNames.length === 0
                    ? 'Names are being loaded. Check your connection.'
                    : 'No names curated for this mood yet.'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dark.black,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
  },
  header: {
    padding: SPACE.md,
    marginTop: SPACE.sm,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    marginTop: 4,
  },
  moodContainer: {
    marginBottom: SPACE.sm,
  },
  moodScroll: {
    paddingHorizontal: SPACE.md,
    gap: 8,
  },
  moodChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  moodChipActive: {
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
    borderColor: 'rgba(45, 156, 150, 0.3)',
  },
  moodText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  moodTextActive: {
    color: '#2d9c96',
  },
  resultCount: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: SPACE.md,
  },
  listContent: {
    padding: SPACE.md,
    paddingBottom: 100,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACE.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemIndex: {
    width: 30,
    alignItems: 'center',
  },
  indexText: {
    color: COLORS.dimmed,
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.sm,
  },
  itemArabic: {
    color: '#c9a84c',
    fontFamily: FONTS.arabic,
    fontSize: 24,
    width: 60,
    textAlign: 'center',
  },
  itemTextWrap: {
    flex: 1,
    marginLeft: SPACE.sm,
  },
  itemTrans: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  itemMeaning: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  itemCategory: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(45, 156, 150, 0.2)',
  },
  categoryText: {
    color: '#2d9c96',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
    marginTop: SPACE.md,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PlaylistScreen;
