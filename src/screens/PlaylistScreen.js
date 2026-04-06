import { useState, useMemo, useEffect } from 'react';
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
import * as Speech from 'expo-speech';
import { useNames, MOODS } from '../context/NamesContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const PlaylistScreen = ({ navigation }) => {
  const { names: allNames, getMoodPlaylist, loading } = useNames();
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [playingId, setPlayingId] = useState(null);

  const playlist = useMemo(() => getMoodPlaylist(selectedMood), [selectedMood, getMoodPlaylist]);

  // Stop speech when mood changes or screen unmounts
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  useEffect(() => {
    Speech.stop();
    setPlayingId(null);
  }, [selectedMood]);

  const buildSpeechText = (item) => {
    const parts = [];

    // Name intro
    parts.push(`${item.transliteration} — ${item.meaning}.`);

    // Benefits of Learning
    const benefits = item.benefits_of_learning || item.benefits;
    if (benefits) {
      const text = Array.isArray(benefits) ? benefits.join('. ') : benefits;
      if (text.trim()) parts.push(`Benefits of learning: ${text}`);
    }

    // Reflection
    const reflection = item.reflection;
    if (reflection) parts.push(`Reflection: ${reflection}`);

    // Learning Insight
    const insight = item.learning_insight || item.learningInsight;
    if (insight && insight !== reflection) parts.push(`Learning Insight: ${insight}`);

    return parts.join(' ');
  };

  const handlePlay = (item) => {
    if (playingId === item.number) {
      Speech.stop();
      setPlayingId(null);
      return;
    }
    Speech.stop();
    const text = buildSpeechText(item);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
    setPlayingId(item.number);
  };

  const handlePlayAll = () => {
    if (playingId === 'ALL') {
      Speech.stop();
      setPlayingId(null);
      return;
    }
    Speech.stop();
    if (playlist.length === 0) return;
    // Build combined text for all items
    const fullText = playlist.map(buildSpeechText).join(' ... Next name: ');
    Speech.speak(fullText, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
    setPlayingId('ALL');
  };

  const renderPlaylistItem = ({ item, index }) => {
    const isPlaying = playingId === item.number;
    return (
      <TouchableOpacity
        style={[styles.playlistItem, isPlaying && styles.playlistItemActive]}
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

        <View style={styles.itemRight}>
          <View style={styles.itemCategory}>
            <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={() => handlePlay(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPlaying ? 'stop' : 'volume-high-outline'}
              size={16}
              color={isPlaying ? '#2d9c96' : COLORS.muted}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>How are you feeling?</Text>
            <Text style={styles.subtitle}>Discover names for your soul's state</Text>
          </View>
          {playlist.length > 0 && (
            <TouchableOpacity
              style={[styles.playAllBtn, playingId === 'ALL' && styles.playAllBtnActive]}
              onPress={handlePlayAll}
            >
              <Ionicons
                name={playingId === 'ALL' ? 'stop-circle' : 'play-circle'}
                size={20}
                color={playingId === 'ALL' ? '#2d9c96' : '#c9a84c'}
              />
              <Text style={[styles.playAllText, playingId === 'ALL' && { color: '#2d9c96' }]}>
                {playingId === 'ALL' ? 'STOP' : 'PLAY ALL'}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* TTS Banner */}
        {playingId && (
          <View style={styles.ttsBanner}>
            <Ionicons name="volume-high" size={14} color="#2d9c96" />
            <Text style={styles.ttsBannerText}>
              {playingId === 'ALL' ? 'Playing full playlist…' : 'Reading name…'}
            </Text>
            <TouchableOpacity onPress={() => { Speech.stop(); setPlayingId(null); }}>
              <Text style={styles.ttsStop}>STOP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Playlist */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  playAllBtnActive: {
    backgroundColor: 'rgba(45,156,150,0.08)',
    borderColor: 'rgba(45,156,150,0.2)',
  },
  playAllText: {
    color: '#c9a84c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
  ttsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACE.md,
    marginBottom: SPACE.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(45,156,150,0.08)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(45,156,150,0.2)',
  },
  ttsBannerText: {
    flex: 1,
    color: '#2d9c96',
    fontSize: 12,
    fontWeight: '600',
  },
  ttsStop: {
    color: '#ff4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
  playlistItemActive: {
    borderColor: 'rgba(45,156,150,0.3)',
    backgroundColor: 'rgba(45,156,150,0.04)',
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
  itemRight: {
    alignItems: 'center',
    gap: 8,
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
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnActive: {
    backgroundColor: 'rgba(45,156,150,0.1)',
    borderColor: 'rgba(45,156,150,0.3)',
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
