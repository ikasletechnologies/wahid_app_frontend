import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import http from '../config/http';

export default function PlaylistScreen() {
  const { colors, isDark } = useAppTheme();
  const { 
    customPlaylists, presets, dailyPlaylist, 
    playQueue, activeTrack, togglePlay, currentIdx 
  } = usePlaylist();

  const [aiPrompt, setAiPrompt] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [viewMode, setViewMode] = useState("dashboard"); // 'dashboard' | 'tracks'
  const [currentViewTitle, setCurrentViewTitle] = useState("");
  const [currentTracks, setCurrentTracks] = useState([]);

  // Load a playlist into track view
  const openTracks = (title, tracks) => {
    setCurrentViewTitle(title);
    setCurrentTracks(tracks);
    setViewMode("tracks");
  };

  // Run AI Search
  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setLoadingAi(true);
    try {
      const res = await http.post('/api/playlist/ai-recommend', { prompt: aiPrompt });
      if (res.data?.success) {
        openTracks("AI Recommended", res.data.names);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingAi(false);
      setAiPrompt("");
    }
  };

  const renderTrackItem = ({ item, index }) => {
    const isPlayingThis = activeTrack && activeTrack.number === item.number;
    return (
      <TouchableOpacity 
        style={[styles.trackRow, { backgroundColor: colors.card, borderColor: isPlayingThis ? colors.primary : colors.border }]}
        onPress={() => playQueue(currentTracks, currentViewTitle, index)}
      >
        <Text style={[styles.trackIdx, { color: colors.textMuted }]}>{index + 1}</Text>
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={[styles.trackTrans, { color: colors.text }]}>{item.transliteration}</Text>
          <Text style={[styles.trackMeaning, { color: colors.textMuted }]}>{item.meaning}</Text>
        </View>
        <Text style={[styles.trackArabic, { color: isDark ? '#c9a84c' : colors.primary }]}>{item.arabic}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {viewMode === "dashboard" ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, { color: colors.text }]}>Your Library</Text>

          {/* AI Mood Search */}
          <View style={[styles.aiInputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput 
              placeholder="How are you feeling today?"
              placeholderTextColor={colors.textMuted}
              style={[styles.aiInput, { color: colors.text }]}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              onSubmitEditing={handleAiSearch}
            />
            {loadingAi ? <ActivityIndicator color={colors.primary} /> : (
              <TouchableOpacity onPress={handleAiSearch}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Daily Playlist */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TODAY</Text>
          <TouchableOpacity onPress={() => openTracks("Daily Journey", dailyPlaylist)}>
            <LinearGradient colors={['#1B4332','#0A2416']} style={styles.dailyCard}>
              <Text style={styles.dailyTitle}>Daily Journey</Text>
              <Text style={styles.dailySub}>{dailyPlaylist.length} personalised names</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Custom Playlists */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>YOUR PLAYLISTS</Text>
          {customPlaylists.map(playlist => (
            <TouchableOpacity 
              key={playlist.id} 
              style={[styles.customCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="musical-note" size={24} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.customTitle, { color: colors.text }]}>{playlist.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{playlist.nameNumbers?.length || 0} tracks</Text>
              </View>
            </TouchableOpacity>
          ))}
          {customPlaylists.length === 0 && (
            <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>No custom playlists yet.</Text>
          )}

          {/* Presets */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>GUIDED PRESETS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {presets.map(p => (
              <TouchableOpacity key={p.id} style={styles.presetCard} onPress={() => playQueue([], p.title, 0)}>
                <LinearGradient colors={p.colors} style={styles.presetGrad}>
                  <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>{p.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setViewMode("dashboard")}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{currentViewTitle}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <FlatList 
            data={currentTracks}
            keyExtractor={item => item.number.toString()}
            renderItem={renderTrackItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  aiInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 24 },
  aiInput: { flex: 1, fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginTop: 10 },
  dailyCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  dailyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dailySub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  customCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10 },
  customTitle: { fontSize: 16, fontWeight: '600' },
  presetCard: { width: 140, height: 100, marginRight: 12, borderRadius: 12, overflow: 'hidden' },
  presetGrad: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  trackIdx: { fontSize: 14, fontWeight: 'bold', width: 24 },
  trackTrans: { fontSize: 16, fontWeight: 'bold' },
  trackMeaning: { fontSize: 12, marginTop: 2 },
  trackArabic: { fontSize: 24, fontFamily: 'Amiri-Regular' }
});
