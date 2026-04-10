import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Animated, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { usePlaylist } from '../context/PlaylistContext';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import http from '../config/http';
import Toast from 'react-native-toast-message';
import PlaylistPicker from '../components/PlaylistPicker';

const TRACK_ROW_H = 72;

// Gradient per name number (same as NowPlayingScreen)
const THUMB_GRADIENTS = [
  ['#0d1f3a', '#1a3d6e'],
  ['#1a0d3a', '#3a1a6e'],
  ['#0d2a1a', '#1a5a37'],
  ['#2a1a0d', '#5a3a1a'],
  ['#2a0d0d', '#5a1a1a'],
  ['#0d2a2a', '#1a5555'],
  ['#1a1a0d', '#3a3a1a'],
  ['#1d0d2a', '#3d1a5a'],
];
const getThumbGradient = (num) => THUMB_GRADIENTS[(num - 1) % THUMB_GRADIENTS.length];

// Mood keyword detection — maps user input to closest mood
const MOOD_MAP = [
  { keywords: ['anxious', 'anxiety', 'worry', 'worried', 'nervous', 'panic'], mood: 'anxious' },
  { keywords: ['sad', 'depress', 'unhappy', 'cry', 'tears', 'miserable'], mood: 'sad' },
  { keywords: ['peace', 'calm', 'serene', 'quiet', 'still', 'tranquil'], mood: 'seeking peace' },
  { keywords: ['alone', 'lonely', 'isolated', 'no one', 'empty'], mood: 'lonely' },
  { keywords: ['grateful', 'thankful', 'gratitude', 'blessed', 'appreciat'], mood: 'grateful' },
  { keywords: ['hopeful', 'hope', 'optimist', 'better', 'brighter'], mood: 'hopeful' },
  { keywords: ['overwhelm', 'stress', 'burden', 'too much', 'exhausted'], mood: 'overwhelmed' },
  { keywords: ['fear', 'afraid', 'scared', 'frighten', 'terror'], mood: 'fearful' },
  { keywords: ['guilt', 'guilty', 'ashamed', 'shame', 'sin', 'regret', 'mistake'], mood: 'seeking forgiveness' },
  { keywords: ['broken', 'hurt', 'pain', 'suffer', 'wound', 'heartbreak'], mood: 'broken' },
  { keywords: ['grief', 'griev', 'loss', 'mourn', 'death', 'lost loved'], mood: 'grieving' },
  { keywords: ['weak', 'helpless', 'powerless', 'strength', 'strong', 'courage'], mood: 'powerless' },
  { keywords: ['forgiv', 'mercy', 'pardon', 'return', 'repent', 'tawbah'], mood: 'seeking forgiveness' },
  { keywords: ['happy', 'joy', 'happy', 'celebrat', 'excit'], mood: 'grateful' },
  { keywords: ['angry', 'anger', 'rage', 'furious', 'frustrat'], mood: 'overwhelmed' },
];

const detectMood = (query) => {
  const q = query.toLowerCase();
  for (const { keywords, mood } of MOOD_MAP) {
    if (keywords.some(k => q.includes(k))) return mood;
  }
  return null;
};

// ──────────────────────────────────────────
// Song Row
// ──────────────────────────────────────────
const TrackRow = React.memo(({ item, index, isActive, onPress, onAddPress, isRemove }) => {
  const { colors, isDark } = useAppTheme();
  const grad = getThumbGradient(item.number);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isActive]);

  return (
    <TouchableOpacity
      style={[styles.trackRow, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      <Animated.View style={[styles.thumbWrap, isActive && { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={grad} style={styles.thumb}>
          {isActive ? (
            <Ionicons name="musical-note" size={14} color="#fff" />
          ) : (
            <Text style={styles.thumbNum}>{index + 1}</Text>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Info */}
      <View style={styles.trackInfo}>
        <Text
          style={[styles.trackTrans, { color: isActive ? '#c9a84c' : colors.text }]}
          numberOfLines={1}
        >
          {item.transliteration}
        </Text>
        <Text style={[styles.trackMeaning, { color: colors.textMuted }]} numberOfLines={1}>
          {item.meaning}
        </Text>
      </View>

      {/* Arabic + play indicator */}
      <View style={styles.trackRight}>
        <Text style={[styles.trackArabic, { color: isDark ? '#c9a84c' : colors.primary }]}>
          {item.arabic}
        </Text>
        <View style={styles.row}>
          {isActive && (
            <Ionicons name="volume-high" size={12} color="#c9a84c" style={{ marginTop: 2, marginRight: 8 }} />
          )}
          <TouchableOpacity onPress={onAddPress} hitSlop={10}>
            <Ionicons 
              name={isRemove ? "trash-outline" : "add"} 
              size={18} 
              color={isRemove ? "#ef4444" : colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ──────────────────────────────────────────
// Option Card (Favorites / Playlist / Recent)
// ──────────────────────────────────────────
const OptionCard = ({ icon, label, count, colors: cardColors, isActive, onPress }) => {
  const { colors, isDark } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.optionCard, { backgroundColor: isDark ? '#111' : '#fff' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient colors={cardColors} style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color="#fff" />
      </LinearGradient>
      <Text style={[styles.optionCount, { color: isActive ? '#c9a84c' : (isDark ? '#fff' : '#000') }]}>{count}</Text>
      <Text style={[styles.optionLabel, { color: isDark ? '#888' : '#666' }]}>{label}</Text>
      {isActive && <View style={styles.optionDot} />}
    </TouchableOpacity>
  );
};

// ──────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────
export default function PlaylistScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const { names, getMoodPlaylist } = useNames();
  const {
    customPlaylists, favouriteIds, recentlyPlayed,
    activeTrack, isPlaying,
    playQueue, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
  } = usePlaylist();

  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState(null); // null | 'name' | 'mood'
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [viewMode, setViewMode] = useState('main'); // main | favorites | playlists | recent | playlist-detail
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const currentPlaylist = useMemo(() => 
    customPlaylists.find(p => p.id === selectedPlaylistId),
    [customPlaylists, selectedPlaylistId]
  );

  // Create playlist modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Add names selector
  const [showNameSelector, setShowNameSelector] = useState(false);

  // Picker
  const [pickingTrack, setPickingTrack] = useState(null);

  // Animated glow for search bar
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(201,168,76,0.3)', 'rgba(45,156,150,0.5)'],
  });

  // Compute derived lists
  const favouriteNames = useMemo(
    () => names.filter(n => favouriteIds.has(n.number)),
    [names, favouriteIds],
  );

  // Which songs to show in the main list (all, filtered, or playlist-detail)
  const displayedSongs = useMemo(() => {
    if (searchMode !== null && filteredSongs.length > 0) return filteredSongs;
    if (viewMode === 'favorites') return favouriteNames;
    if (viewMode === 'recent') return recentlyPlayed;
    if (viewMode === 'playlist-detail' && currentPlaylist) {
      return (currentPlaylist.nameNumbers || [])
        .map(num => names.find(n => n.number === num))
        .filter(Boolean);
    }
    return names;
  }, [searchMode, filteredSongs, viewMode, favouriteNames, recentlyPlayed, currentPlaylist, names]);

  const [aiLoading, setAiLoading] = useState(false);
  const aiDebounce = useRef(null);

  // Smart search:
  // 1. Local mood keyword detection (instant)
  // 2. Local direct name search (instant)
  // 3. If neither matches and query is a sentence → call Gemini AI endpoint
  const handleSearch = useCallback((text) => {
    setSearchText(text);
    const q = text.trim();
    if (!q) { setSearchMode(null); setFilteredSongs([]); setAiLoading(false); return; }

    // Step 1: local mood detection
    const detectedMood = detectMood(q);
    if (detectedMood) {
      const results = getMoodPlaylist(detectedMood);
      setFilteredSongs(results);
      setSearchMode('mood');
      return;
    }

    // Step 2: direct name / meaning search
    const ql = q.toLowerCase();
    const direct = names.filter(n =>
      n.transliteration?.toLowerCase().includes(ql) ||
      n.arabic?.includes(q) ||
      n.meaning?.toLowerCase().includes(ql)
    );
    if (direct.length > 0) {
      setFilteredSongs(direct);
      setSearchMode('name');
      return;
    }

    // Step 3: complex sentence → debounce call to Gemini AI
    if (q.split(' ').length >= 3) {
      setFilteredSongs([]);
      setSearchMode('ai');
      setAiLoading(true);
      clearTimeout(aiDebounce.current);
      aiDebounce.current = setTimeout(async () => {
        try {
          const res = await http.post('/api/playlist/ai-recommend', { prompt: q });
          if (res.data?.success && res.data.names?.length > 0) {
            setFilteredSongs(res.data.names);
          } else {
            setFilteredSongs([]);
          }
        } catch (_) {
          setFilteredSongs([]);
        } finally {
          setAiLoading(false);
        }
      }, 800);
    } else {
      setFilteredSongs([]);
      setSearchMode('name');
    }
  }, [names, getMoodPlaylist]);

  const clearSearch = () => {
    setSearchText('');
    setSearchMode(null);
    setFilteredSongs([]);
  };

  const openPlaylistDetail = (playlist) => {
    setSelectedPlaylistId(playlist.id);
    setViewMode('playlist-detail');
  };

  const goBack = () => {
    if (viewMode === 'playlist-detail') {
      setViewMode('playlists');
    } else {
      setViewMode('main');
      clearSearch();
    }
  };

  const playTrackAt = useCallback((idx) => {
    playQueue(displayedSongs, getViewTitle(), idx);
    navigation.navigate('NowPlaying');
  }, [displayedSongs, viewMode, currentPlaylist, playQueue, navigation]);

  const getViewTitle = () => {
    switch (viewMode) {
      case 'favorites': return 'Favorites';
      case 'recent': return 'Recently Played';
      case 'playlist-detail': return currentPlaylist?.name || 'Playlist';
      default: return searchMode === 'mood' ? 'Mood Picks' : 'All Names';
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    const p = await createPlaylist(newPlaylistName.trim());
    setCreatingPlaylist(false);
    if (p) {
      Toast.show({ type: 'success', text1: 'Playlist Created', text2: `"${newPlaylistName}" is ready.` });
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  const renderTrack = useCallback(({ item, index }) => {
    const isActive = activeTrack?.number === item.number && isPlaying;
    return (
      <TrackRow
        item={item}
        index={index}
        isActive={isActive}
        onPress={() => playTrackAt(index)}
        onAddPress={() => {
          if (viewMode === 'playlist-detail') {
            removeFromPlaylist(selectedPlaylistId, item.number);
          } else {
            setPickingTrack(item);
          }
        }}
        isRemove={viewMode === 'playlist-detail'}
      />
    );
  }, [activeTrack, isPlaying, playTrackAt]);

  const keyExtractor = useCallback((item) => String(item.number), []);
  const getItemLayout = useCallback((_, idx) => ({
    length: TRACK_ROW_H, offset: TRACK_ROW_H * idx, index: idx,
  }), []);

  const isSubView = viewMode !== 'main';

  // ── HEADER for sub-views ──
  const renderSubHeader = () => (
    <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.subHeaderTitle, { color: colors.text }]}>{getViewTitle()}</Text>
      {viewMode === 'playlist-detail' ? (
        <TouchableOpacity 
          onPress={() => setShowNameSelector(true)} 
          hitSlop={12} 
          style={styles.backBtn}
        >
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
    </View>
  );

  // ── PLAYLISTS sub-view ──
  const renderPlaylistsView = () => (
    <View style={{ flex: 1 }}>
      {renderSubHeader()}
      <FlatList
        data={customPlaylists}
        keyExtractor={p => p.id?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.createPlaylistBtn, { borderColor: colors.border }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={[styles.createPlaylistText, { color: colors.primary }]}>New Playlist</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No playlists yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.playlistRow, { backgroundColor: colors.card }]}
            onPress={() => openPlaylistDetail(item)}
          >
            <LinearGradient
              colors={['#1a0d3a', '#3a1a6e']}
              style={styles.playlistRowIcon}
            >
              <Ionicons name="musical-notes" size={18} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.playlistRowName, { color: colors.text }]}>{item.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {item.nameNumbers?.length || 0} names
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => deletePlaylist(item.id)}
              hitSlop={12}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // ── TRACK LIST for favorites / recent / playlist-detail ──
  const renderTrackList = () => (
    <View style={{ flex: 1 }}>
      {renderSubHeader()}
      <FlatList
        data={displayedSongs}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={6}
        removeClippedSubviews
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nothing here yet</Text>
            {viewMode === 'playlist-detail' && (
              <TouchableOpacity 
                style={[styles.addBtnEmpty, { backgroundColor: colors.primary }]}
                onPress={() => setShowNameSelector(true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Names</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );

  // ── MAIN DASHBOARD ──
  const renderMainDashboard = () => (
    <FlatList
      data={displayedSongs}
      keyExtractor={keyExtractor}
      renderItem={renderTrack}
      getItemLayout={getItemLayout}
      initialNumToRender={12}
      maxToRenderPerBatch={8}
      windowSize={6}
      removeClippedSubviews
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 16 }}>
          {/* Page title */}
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Library</Text>
            <TouchableOpacity
              onPress={() => { setViewMode('playlists'); }}
              hitSlop={12}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* AI Search Bar */}
          <Animated.View
            style={[
              styles.searchOuter,
              {
                borderColor: searchFocused ? '#c9a84c' : glowColor,
                backgroundColor: isDark ? '#0d0d0d' : '#f5f5f5',
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={searchMode === 'mood' ? '#c9a84c' : '#666'}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or feeling..."
              placeholderTextColor="#555"
              value={searchText}
              onChangeText={handleSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {aiLoading
              ? <ActivityIndicator size="small" color="#c9a84c" />
              : searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color="#555" />
                </TouchableOpacity>
              )
            }
          </Animated.View>

          {/* Search hint */}
          {searchMode === 'mood' && (
            <Text style={styles.searchHint}>Showing names for your feeling</Text>
          )}
          {searchMode === 'ai' && !aiLoading && filteredSongs.length > 0 && (
            <Text style={styles.searchHint}>AI recommended for you</Text>
          )}
          {searchMode === 'ai' && !aiLoading && filteredSongs.length === 0 && (
            <Text style={styles.searchHint}>No results — try a different phrase</Text>
          )}
          {searchMode === 'name' && filteredSongs.length === 0 && (
            <Text style={styles.searchHint}>No matching names found</Text>
          )}

          {/* 3 Option Cards */}
          {searchMode === null && (
            <View style={styles.optionRow}>
              <OptionCard
                icon="heart"
                label="Favorites"
                count={favouriteNames.length}
                colors={['#7a0d2a', '#c9254a']}
                isActive={viewMode === 'favorites'}
                onPress={() => setViewMode('favorites')}
              />
              <OptionCard
                icon="musical-notes"
                label="Playlists"
                count={customPlaylists.length}
                colors={['#1a0d3a', '#3a1a7a']}
                isActive={viewMode === 'playlists'}
                onPress={() => setViewMode('playlists')}
              />
              <OptionCard
                icon="time"
                label="Recent"
                count={recentlyPlayed.length}
                colors={['#0d2a2a', '#1a5a5a']}
                isActive={viewMode === 'recent'}
                onPress={() => setViewMode('recent')}
              />
            </View>
          )}

          {/* Section label */}
          <View style={[styles.sectionBar, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {searchMode === 'mood'
                ? `MOOD PICKS · ${filteredSongs.length}`
                : searchMode === 'ai'
                  ? aiLoading ? 'AI THINKING...' : `AI PICKS · ${filteredSongs.length}`
                  : searchMode === 'name'
                    ? `RESULTS · ${filteredSongs.length}`
                    : `ALL NAMES · ${names.length}`}
            </Text>
            {activeTrack && (
              <TouchableOpacity onPress={() => navigation.navigate('NowPlaying')}>
                <Text style={[styles.nowPlayingLink, { color: colors.primary }]}>
                  Now Playing ›
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      }
    />
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Route between views */}
      {isSubView && viewMode === 'playlists'
        ? renderPlaylistsView()
        : isSubView
          ? renderTrackList()
          : renderMainDashboard()
      }

      {/* Create Playlist Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Playlist</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Give it a name..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              onSubmitEditing={handleCreatePlaylist}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => { setShowCreateModal(false); setNewPlaylistName(''); }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700' }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreatePlaylist}
                disabled={creatingPlaylist}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {creatingPlaylist ? '...' : 'CREATE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PlaylistPicker
        visible={!!pickingTrack}
        onHide={() => setPickingTrack(null)}
        nameNumber={pickingTrack?.number}
        nameTitle={pickingTrack?.transliteration}
      />

      {/* Name Selector Modal */}
      <Modal visible={showNameSelector} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowNameSelector(false)} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.subHeaderTitle, { color: colors.text }]}>Add to {currentPlaylist?.name}</Text>
            <View style={{ width: 36 }} />
          </View>
          <FlatList
            data={names}
            keyExtractor={item => String(item.number)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const inPlaylist = currentPlaylist?.nameNumbers?.includes(item.number);
              return (
                <View style={[styles.trackRow, { backgroundColor: colors.card, marginHorizontal: 0 }]}>
                    <View style={styles.thumbWrap}>
                      <LinearGradient colors={getThumbGradient(item.number)} style={styles.thumb}>
                          <Text style={styles.thumbNum}>{item.number}</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.trackInfo}>
                        <Text style={[styles.trackTrans, { color: colors.text }]}>{item.transliteration}</Text>
                        <Text style={[styles.trackMeaning, { color: colors.textMuted }]}>{item.meaning}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={async () => {
                        if (!inPlaylist) {
                          await addToPlaylist(currentPlaylist.id, item.number);
                        }
                      }}
                      disabled={inPlaylist}
                    >
                       <Ionicons 
                        name={inPlaylist ? "checkmark-circle" : "add-circle-outline"} 
                        size={28} 
                        color={inPlaylist ? "#10b981" : colors.primary} 
                       />
                    </TouchableOpacity>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  pageTitle: { fontSize: 30, fontWeight: '900' },

  // AI Search
  searchOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  searchHint: {
    color: '#c9a84c',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },

  // Option cards
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    position: 'relative',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionCount: { fontSize: 20, fontWeight: '900', color: '#fff' },
  optionLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  optionDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#c9a84c',
  },

  // Section bar
  sectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  nowPlayingLink: { fontSize: 12, fontWeight: '700' },

  // Track row
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TRACK_ROW_H,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
  },
  thumbWrap: { marginRight: 12 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbNum: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '800' },
  trackInfo: { flex: 1, paddingRight: 8 },
  trackTrans: { fontSize: 15, fontWeight: '700' },
  trackMeaning: { fontSize: 12, marginTop: 2 },
  trackRight: { alignItems: 'flex-end' },
  trackArabic: { fontSize: 22, fontFamily: 'Amiri-Regular' },
  row: { flexDirection: 'row', alignItems: 'center' },

  // Sub-view header
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  subHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },

  // Playlist rows
  createPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  createPlaylistText: { fontSize: 15, fontWeight: '700' },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  playlistRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistRowName: { fontSize: 15, fontWeight: '700' },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14 },
  addBtnEmpty: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: { padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
