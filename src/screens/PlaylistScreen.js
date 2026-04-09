/**
 * PlaylistScreen — Full WAHID Playlist Experience
 *
 * Sections:
 *  1. Hero player  — mood gradient · Arabic name · waveform · controls
 *  2. Resume banner — "Continue your journey" when a prior session exists
 *  3. Insights banner — personalised suggestion based on mood history
 *  4. Daily Playlist card — today's curated 7-name journey
 *  5. Preset playlists — horizontal scroll (Calm Journey, Strength, Healing, …)
 *  6. Mood chips — switch the active mood
 *  7. Track list — weighted, favourites-boosted name list
 *
 * Backend integrations (all via PlaylistContext):
 *   ✓ fetchPlaylist(mood)          GET /api/playlist?mood=X  → weighted fallback
 *   ✓ fetchPresetPlaylist(id)      union of preset moods, client-side
 *   ✓ dailyPlaylist                GET /api/playlist/daily   → NamesContext fallback
 *   ✓ toggleFavourite(num)         POST/DELETE /api/playlist/favourites/:num
 *   ✓ saveSession(mood,idx,title)  POST /api/playlist/session (debounced)
 *   ✓ resumeSession                resume banner on reopen
 *   ✓ logMood(mood)                POST /api/mood-log
 *   ✓ insights                     GET /api/insights  → local moodHistory fallback
 */
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useNames, MOODS } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SPACE, RADIUS } from '../theme';

// ─── Waveform ─────────────────────────────────────────────────────────────────
const BAR_COUNT   = 28;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => 6 + ((Math.sin(i * 0.8) + 1) * 14));

const WaveformBar = React.memo(({ baseH, delay, isPlaying }) => {
  const scale = useRef(new Animated.Value(0.35)).current;
  const loop  = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      loop.current = Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 0.4 + Math.random() * 0.6, duration: 300 + delay * 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.2 + Math.random() * 0.3, duration: 300 + delay * 80, useNativeDriver: true }),
      ]));
      loop.current.start();
    } else {
      loop.current?.stop();
      Animated.timing(scale, { toValue: 0.35, duration: 200, useNativeDriver: true }).start();
    }
    return () => loop.current?.stop();
  }, [isPlaying]);
  return <Animated.View style={{ width: 3, height: baseH, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)', transform: [{ scaleY: scale }], transformOrigin: 'bottom' }} />;
});

const Waveform = ({ isPlaying }) => (
  <View style={styles.waveform}>
    {BAR_HEIGHTS.map((h, i) => <WaveformBar key={i} baseH={h} delay={i} isPlaying={isPlaying} />)}
  </View>
);

// ─── Mosque geometric art ─────────────────────────────────────────────────────
const MosqueArt = () => (
  <View style={styles.mosqueWrap}>
    <View style={styles.dome} />
    <View style={[styles.minaret, { left: 18 }]}><View style={styles.minaretCap} /></View>
    <View style={[styles.minaret, { right: 18 }]}><View style={styles.minaretCap} /></View>
    <View style={styles.mosqueBody} />
    <View style={styles.archWindow} />
    <Text style={[styles.star, { top: 2, left: 8 }]}>✦</Text>
    <Text style={[styles.star, { top: 6, right: 10 }]}>✦</Text>
    <Text style={[styles.star, { top: 0, left: '50%' }]}>✦</Text>
  </View>
);

// ─── Mood maps ────────────────────────────────────────────────────────────────
const MOOD_EMOJI = {
  anxious:'😟', sad:'😢', 'seeking peace':'🕊️', lonely:'🤍',
  'seeking forgiveness':'🙏', overwhelmed:'🌊', powerless:'💫',
  'seeking purity':'✨', 'spiritually low':'🕯️', distracted:'🍃',
  fearful:'🫶', worried:'😔', 'feeling unseen':'👁️',
  grateful:'🌟', hopeful:'🌅', peaceful:'🍃', broken:'💔',
  grieving:'🌧️', angry:'🔥', guilty:'🙏', burdened:'⚖️',
  hopeless:'🌑', weak:'🌿', defeated:'🏳️',
};
const moodEmoji = m => MOOD_EMOJI[m] || '🌿';

const MOOD_HERO = {
  anxious:               { colors: ['#0A1E3D','#0D2447','#061020'], accent: '#7EB8F7' },
  sad:                   { colors: ['#1A0A2E','#220D3B','#100618'], accent: '#A78BFA' },
  grateful:              { colors: ['#2D1E00','#3D2A00','#1A1100'], accent: '#FBBF24' },
  hopeful:               { colors: ['#0A2416','#0D2B1A','#061408'], accent: '#86EFAC' },
  peaceful:              { colors: ['#002E2E','#004040','#001818'], accent: '#2DD4BF' },
  'seeking peace':       { colors: ['#002E2E','#004040','#001818'], accent: '#2DD4BF' },
  lonely:                { colors: ['#1A1A2E','#16213E','#0D1830'], accent: '#818CF8' },
  overwhelmed:           { colors: ['#2D1414','#3D1C1C','#1A0A0A'], accent: '#FCA5A5' },
  'seeking forgiveness': { colors: ['#0D1F0A','#122614','#081208'], accent: '#86EFAC' },
  powerless:             { colors: ['#1A1414','#2E1C1C','#0A0808'], accent: '#F87171' },
  'seeking purity':      { colors: ['#002838','#003348','#001520'], accent: '#67E8F9' },
  'spiritually low':     { colors: ['#1A1414','#261E14','#100D08'], accent: '#FDE68A' },
  fearful:               { colors: ['#0A1430','#0D1A3D','#060A1A'], accent: '#93C5FD' },
  worried:               { colors: ['#0A1430','#0D1A3D','#060A1A'], accent: '#93C5FD' },
  broken:                { colors: ['#1A0A1A','#28102A','#0D0510'], accent: '#F9A8D4' },
  grieving:              { colors: ['#0A0A1A','#14142E','#060610'], accent: '#C4B5FD' },
  guilty:                { colors: ['#0A1F14','#0D2B1A','#061408'], accent: '#6EE7B7' },
  angry:                 { colors: ['#2D0A00','#3D1000','#1A0600'], accent: '#FCA5A5' },
  hopeless:              { colors: ['#0A0A14','#141420','#06060A'], accent: '#94A3B8' },
  burdened:              { colors: ['#1A1420','#221A2C','#0D0A12'], accent: '#C4B5FD' },
  distracted:            { colors: ['#0A2010','#0D2B1A','#061408'], accent: '#6EE7B7' },
};
const DEFAULT_MOOD_HERO = { colors: ['#0A2010','#0D2B1A','#061408'], accent: '#6EE7B7' };

const MOOD_TITLES = {
  anxious:'Calm Your Heart', sad:'You Are Not Alone',
  'seeking peace':'Find Your Stillness', lonely:'Never Truly Alone',
  'seeking forgiveness':'Return to Him', overwhelmed:'He Carries Your Burden',
  powerless:'His Power Is Yours', 'seeking purity':'Purify Your Soul',
  'spiritually low':'Reignite Your Light', distracted:'Come Back to Him',
  fearful:'He Is Your Protector', worried:'Trust in His Plan',
  'feeling unseen':'He Sees Everything', grateful:'Count Your Blessings',
  hopeful:'Your Hope Lives On', peaceful:'Dwell in His Peace',
  hopeless:'Hope Never Dies', grieving:'He Heals Every Heart',
  broken:'He Mends the Broken', burdened:'Lay Down Your Burdens',
  weak:'His Strength Is Yours', defeated:'Rise Through His Names',
  guilty:'Seek His Forgiveness', angry:'He Calms Every Storm',
  impatient:'Trust His Timing', purposeless:'Your Purpose With Him',
  wondering:'Discover His Majesty', curious:'Discover His Majesty',
  questioning:'He Holds All Answers', 'self-doubt':'He Believes in You',
  'seeking blessings':'Open Every Door', 'financial stress':'Al-Razzaq Provides',
  stuck:'He Opens Every Path', 'seeking breakthrough':'He Removes All Barriers',
  frustrated:'Surrender to His Plan', 'confused about fate':'Trust the Unseen Plan',
  misunderstood:'He Understands You', 'seeking accountability':'He Is the Most Just',
  disrespected:'His Honor Is Yours', unloved:'He Loves Infinitely',
  'seeking validation':'His Approval Is Enough', disconnected:'Return to His Presence',
  detached:'Come Home to Him', vulnerable:'He Is Your Shield',
  oppressed:'He Is the Avenger', proud:'Return to Humility',
  arrogant:'Remember Who Is Greater', 'spiritually disconnected':'Find Your Way Back',
};
const getMoodTitle = m => MOOD_TITLES[m] || `A Reflection on ${m.charAt(0).toUpperCase() + m.slice(1)}`;

// ─── PlaylistScreen ───────────────────────────────────────────────────────────
const PlaylistScreen = () => {
  const { names: allNames, loading: namesLoading } = useNames();
  const {
    fetchPlaylist, fetchPresetPlaylist,
    presets, dailyPlaylist,
    favouriteIds, toggleFavourite,
    saveSession, resumeSession, clearResumeSession,
    logMood, insights,
  } = usePlaylist();
  const { colors, isDark } = useAppTheme();

  // ── Playlist state ──────────────────────────────────────────────────────
  const [selectedMood,    setSelectedMood]    = useState(MOODS[0]);
  const [playlist,        setPlaylist]        = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  // label shown in hero (mood title OR preset/daily title)
  const [heroTitle,       setHeroTitle]       = useState(getMoodTitle(MOODS[0]));
  const [heroSubtitle,    setHeroSubtitle]    = useState(null); // preset subtitle

  // ── Playback state ──────────────────────────────────────────────────────
  const [playingId,    setPlayingId]    = useState(null);
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [isLoop,       setIsLoop]       = useState(false);
  const [playMode,     setPlayMode]     = useState('normal'); // 'normal' | 'guided'

  // ── UI state ─────────────────────────────────────────────────────────────
  const [insightsDismissed, setInsightsDismissed] = useState(false);

  const currentTrack = playlist[currentIdx] || null;
  const moodHero     = MOOD_HERO[selectedMood] || DEFAULT_MOOD_HERO;
  const durationMin  = Math.max(1, Math.ceil(playlist.length * 0.5));

  // Refs: prevent stale closures in speech callbacks
  const playlistRef     = useRef(playlist);
  const isLoopRef       = useRef(isLoop);
  const playModeRef     = useRef(playMode);
  const selectedMoodRef = useRef(selectedMood);
  const heroTitleRef    = useRef(heroTitle);
  const speakAtIdxRef   = useRef(null);
  const autoNextTimer   = useRef(null);

  useEffect(() => { playlistRef.current     = playlist;     }, [playlist]);
  useEffect(() => { isLoopRef.current       = isLoop;       }, [isLoop]);
  useEffect(() => { playModeRef.current     = playMode;     }, [playMode]);
  useEffect(() => { selectedMoodRef.current = selectedMood; }, [selectedMood]);
  useEffect(() => { heroTitleRef.current    = heroTitle;    }, [heroTitle]);

  // ── Fetch mood playlist whenever mood changes ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPlaylistLoading(true);
    fetchPlaylist(selectedMood).then(result => {
      if (!cancelled) { setPlaylist(result); setPlaylistLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedMood, fetchPlaylist]);

  // ── Breathing animation (always running) ───────────────────────────────
  const breathAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1.25, duration: 4000, useNativeDriver: true }),
      Animated.timing(breathAnim, { toValue: 1.0,  duration: 4000, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────
  useEffect(() => () => { Speech.stop(); clearTimeout(autoNextTimer.current); }, []);
  useEffect(() => {
    Speech.stop(); clearTimeout(autoNextTimer.current);
    setPlayingId(null); setCurrentIdx(0);
  }, [playlist]); // reset player when playlist swaps

  // ── TTS text builder ────────────────────────────────────────────────────
  const buildText = useCallback((item) => {
    const parts = [`${item.transliteration} — ${item.meaning}.`];
    const benefits = Array.isArray(item.benefits) ? item.benefits.join('. ') : (item.benefits_of_learning || item.benefits || '');
    if (benefits?.trim()) parts.push(`Benefits: ${benefits}`);
    if (item.reflection)  parts.push(`Reflection: ${item.reflection}`);
    const insight = item.learning_insight || item.learningInsight;
    if (insight && insight !== item.reflection) parts.push(`Insight: ${insight}`);
    // Guided mode: add longer pause text
    if (playModeRef.current === 'guided') parts.push('Take a moment to reflect on this name.');
    return parts.join(' ');
  }, []);

  // ── Core: speakAtIdx ────────────────────────────────────────────────────
  const speakAtIdx = useCallback((idx) => {
    const pl   = playlistRef.current;
    const item = pl[idx];
    if (!item) return;
    clearTimeout(autoNextTimer.current);
    Speech.stop();
    setCurrentIdx(idx);
    setPlayingId(item.number);
    saveSession(selectedMoodRef.current, idx, heroTitleRef.current);

    Speech.speak(buildText(item), {
      language: 'en-US',
      rate: playModeRef.current === 'guided' ? 0.80 : 0.88,
      onDone: () => {
        setPlayingId(null);
        // Guided mode pauses longer (3 s) for reflection
        const pauseMs = playModeRef.current === 'guided' ? 3000 : 1500;
        autoNextTimer.current = setTimeout(() => {
          const pl2     = playlistRef.current;
          const nextIdx = idx + 1 < pl2.length ? idx + 1 : isLoopRef.current ? 0 : -1;
          if (nextIdx >= 0) speakAtIdxRef.current?.(nextIdx);
        }, pauseMs);
      },
      onStopped: () => { setPlayingId(null); clearTimeout(autoNextTimer.current); },
      onError:   () => { setPlayingId(null); clearTimeout(autoNextTimer.current); },
    });
  }, [buildText, saveSession]);

  useEffect(() => { speakAtIdxRef.current = speakAtIdx; }, [speakAtIdx]);

  // ── Playback controls ───────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (playingId !== null) { Speech.stop(); clearTimeout(autoNextTimer.current); setPlayingId(null); return; }
    speakAtIdx(currentIdx);
  }, [playingId, currentIdx, speakAtIdx]);

  const handlePrev = useCallback(() => {
    speakAtIdx(currentIdx > 0 ? currentIdx - 1 : isLoop ? playlist.length - 1 : 0);
  }, [currentIdx, playlist.length, isLoop, speakAtIdx]);

  const handleNext = useCallback(() => {
    speakAtIdx(currentIdx < playlist.length - 1 ? currentIdx + 1 : isLoop ? 0 : playlist.length - 1);
  }, [currentIdx, playlist.length, isLoop, speakAtIdx]);

  const handleLoop      = useCallback(() => setIsLoop(v => !v), []);
  const cyclePlayMode   = useCallback(() => setPlayMode(m => m === 'normal' ? 'guided' : 'normal'), []);

  const handleTrackPress = useCallback((item) => {
    const idx = playlist.findIndex(p => p.number === item.number);
    if (playingId === item.number) { Speech.stop(); clearTimeout(autoNextTimer.current); setPlayingId(null); }
    else speakAtIdx(idx >= 0 ? idx : 0);
  }, [playingId, playlist, speakAtIdx]);

  // ── Load a named set of tracks (preset or daily) ────────────────────────
  const loadPreset = useCallback(async (preset) => {
    Speech.stop(); clearTimeout(autoNextTimer.current);
    setPlayingId(null); setCurrentIdx(0);
    setHeroTitle(preset.title);
    setHeroSubtitle(preset.subtitle);
    setPlaylistLoading(true);
    const items = await fetchPresetPlaylist(preset.id);
    setPlaylist(items);
    setPlaylistLoading(false);
  }, [fetchPresetPlaylist]);

  const loadDailyPlaylist = useCallback(() => {
    Speech.stop(); clearTimeout(autoNextTimer.current);
    setPlayingId(null); setCurrentIdx(0);
    setHeroTitle("Today's Journey");
    setHeroSubtitle('Your daily curated playlist');
    setPlaylist(dailyPlaylist);
  }, [dailyPlaylist]);

  // ── Mood chip press ─────────────────────────────────────────────────────
  const handleMoodSelect = useCallback((mood) => {
    if (mood === selectedMood) return;
    logMood(mood);
    setSelectedMood(mood);
    setHeroTitle(getMoodTitle(mood));
    setHeroSubtitle(null);
  }, [selectedMood, logMood]);

  // ── Resume session ──────────────────────────────────────────────────────
  const pendingResumeIdx = useRef(null);
  const handleResumeFull = useCallback(() => {
    if (!resumeSession) return;
    pendingResumeIdx.current = resumeSession.trackIndex;
    logMood(resumeSession.mood);
    setSelectedMood(resumeSession.mood);
    setHeroTitle(resumeSession.title || getMoodTitle(resumeSession.mood));
    setHeroSubtitle(null);
    clearResumeSession();
  }, [resumeSession, logMood, clearResumeSession]);

  useEffect(() => {
    if (pendingResumeIdx.current !== null && playlist.length > 0) {
      setCurrentIdx(Math.min(pendingResumeIdx.current, playlist.length - 1));
      pendingResumeIdx.current = null;
    }
  }, [playlist]);

  const isPlaying    = playingId !== null;
  const prevDisabled = !isLoop && currentIdx <= 0;
  const nextDisabled = !isLoop && currentIdx >= playlist.length - 1;
  const isLoading    = namesLoading || playlistLoading;

  // ── Track row ───────────────────────────────────────────────────────────
  const renderTrack = useCallback(({ item, index }) => {
    const active    = playingId === item.number;
    const isCurrent = index === currentIdx;
    const isFav     = favouriteIds.has(Number(item.number));
    return (
      <TouchableOpacity
        style={[styles.trackRow, {
          backgroundColor: active ? (isDark ? 'rgba(45,106,79,0.18)' : 'rgba(45,106,79,0.1)') : colors.card,
          borderColor: active ? 'rgba(45,106,79,0.45)' : colors.border,
        }]}
        onPress={() => handleTrackPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.trackIdx, active && { backgroundColor: '#2D6A4F' }]}>
          {active
            ? <Ionicons name="volume-high" size={12} color="#fff" />
            : <Text style={[styles.trackIdxText, { color: isCurrent ? '#2D6A4F' : colors.textDimmed }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>}
        </View>
        <Text style={[styles.trackArabic, { color: isDark ? '#c9a84c' : '#2D6A4F' }]}>{item.arabic}</Text>
        <View style={styles.trackMeta}>
          <Text style={[styles.trackTrans,   { color: colors.text }]}     numberOfLines={1}>{item.transliteration}</Text>
          <Text style={[styles.trackMeaning, { color: colors.textMuted }]} numberOfLines={1}>{item.meaning}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavourite(item.number)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.trackFavBtn}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={14} color={isFav ? '#F87171' : colors.textDimmed} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.trackPlayBtn, { backgroundColor: active ? '#2D6A4F' : colors.glass, borderColor: active ? '#2D6A4F' : colors.border }]}
          onPress={() => handleTrackPress(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={active ? 'stop' : 'play'} size={13} color={active ? '#fff' : colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [playingId, currentIdx, isDark, colors, handleTrackPress, favouriteIds, toggleFavourite]);

  // ── Preset card ─────────────────────────────────────────────────────────
  const renderPreset = useCallback((preset) => (
    <TouchableOpacity key={preset.id} onPress={() => loadPreset(preset)} activeOpacity={0.82}>
      <LinearGradient colors={preset.colors} style={styles.presetCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.presetEmoji}>{preset.emoji}</Text>
        <Text style={styles.presetTitle}>{preset.title}</Text>
        <Text style={styles.presetSub}>{preset.subtitle}</Text>
        <View style={[styles.presetAccentDot, { backgroundColor: preset.accent }]} />
      </LinearGradient>
    </TouchableOpacity>
  ), [loadPreset]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <LinearGradient colors={moodHero.colors} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}>
        <Animated.View style={[styles.heroBgCircle1, { transform: [{ scale: breathAnim }] }]} />
        <View style={styles.heroBgCircle2} />
        <MosqueArt />

        <Text style={styles.playlistTitle}>{heroTitle}</Text>
        {heroSubtitle
          ? <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
          : (
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaText}>{moodEmoji(selectedMood)} {selectedMood}</Text>
              <Text style={styles.heroMetaDot}>·</Text>
              <Text style={styles.heroMetaText}>{durationMin} min</Text>
              <Text style={styles.heroMetaDot}>·</Text>
              <Text style={styles.heroMetaText}>{playlist.length} names</Text>
            </View>
          )}

        {/* Now-playing: Arabic + glow + meaning + reflection */}
        {currentTrack && (
          <View style={styles.nowPlaying}>
            <Text style={[styles.nowPlayingArabic, isPlaying && { textShadowColor: moodHero.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 }]}>
              {currentTrack.arabic}
            </Text>
            <Text style={styles.nowPlayingTrans}>{currentTrack.transliteration}</Text>
            <Text style={styles.nowPlayingMeaning}>{currentTrack.meaning}</Text>
            {currentTrack.reflection
              ? <Text style={styles.nowPlayingReflection} numberOfLines={2}>"{currentTrack.reflection}"</Text>
              : null}
          </View>
        )}

        <Waveform isPlaying={isPlaying} />

        {/* Controls: [mode] [⏮] [▶/⏸] [⏭] [🔁] [♡] */}
        <View style={styles.controls}>
          {/* Guided / Normal mode toggle */}
          <TouchableOpacity onPress={cyclePlayMode} style={styles.ctrlBtn}>
            <Ionicons
              name={playMode === 'guided' ? 'leaf' : 'leaf-outline'}
              size={18}
              color={playMode === 'guided' ? moodHero.accent : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePrev} style={styles.ctrlBtn} disabled={prevDisabled}>
            <Ionicons name="play-skip-back" size={22} color={prevDisabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playCircle} disabled={playlist.length === 0}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={isDark ? '#c9a84c' : '#2D6A4F'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.ctrlBtn} disabled={nextDisabled}>
            <Ionicons name="play-skip-forward" size={22} color={nextDisabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLoop} style={styles.ctrlBtn}>
            <Ionicons name="repeat" size={20} color={isLoop ? moodHero.accent : 'rgba(255,255,255,0.5)'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctrlBtn} onPress={() => currentTrack && toggleFavourite(currentTrack.number)} disabled={!currentTrack}>
            <Ionicons
              name={currentTrack && favouriteIds.has(Number(currentTrack.number)) ? 'heart' : 'heart-outline'}
              size={20}
              color={currentTrack && favouriteIds.has(Number(currentTrack.number)) ? '#F87171' : 'rgba(255,255,255,0.5)'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── List body ─────────────────────────────────────────────────────── */}
      <FlatList
        data={playlist}
        keyExtractor={item => item.number.toString()}
        renderItem={renderTrack}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Resume banner */}
            {resumeSession && !isPlaying && (
              <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
                <Ionicons name="play-circle" size={20} color={colors.primary} />
                <View style={styles.bannerText}>
                  <Text style={[styles.bannerTitle, { color: colors.text }]} numberOfLines={1}>
                    Continue: {resumeSession.title || resumeSession.mood}
                  </Text>
                  <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
                    Track {(resumeSession.trackIndex || 0) + 1} · {resumeSession.mood}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleResumeFull} style={[styles.bannerBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.bannerBtnText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearResumeSession} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Insights suggestion banner */}
            {insights?.suggestion && !insightsDismissed && (
              <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
                <Ionicons name="bulb-outline" size={20} color="#FBBF24" />
                <Text style={[styles.bannerTitle, { color: colors.text, flex: 1, marginLeft: 8 }]} numberOfLines={2}>
                  {insights.suggestion.text}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const preset = presets.find(p => p.id === insights.suggestion.presetId);
                    if (preset) loadPreset(preset);
                    setInsightsDismissed(true);
                  }}
                  style={[styles.bannerBtn, { backgroundColor: '#FBBF24' }]}
                >
                  <Text style={[styles.bannerBtnText, { color: '#000' }]}>Try it</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setInsightsDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 4 }}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Daily Playlist card */}
            {dailyPlaylist.length > 0 && (
              <TouchableOpacity onPress={loadDailyPlaylist} activeOpacity={0.82} style={styles.dailyCard}>
                <LinearGradient colors={['#0A2010','#1B4332','#0A2416']} style={styles.dailyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dailyLabel}>TODAY'S JOURNEY</Text>
                    <Text style={styles.dailyTitle}>Your Daily Playlist</Text>
                    <Text style={styles.dailySub}>{dailyPlaylist.length} names · personalised for you</Text>
                  </View>
                  <View style={styles.dailyPlayBtn}>
                    <Ionicons name="play" size={20} color="#1B4332" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Preset playlists */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>GUIDED JOURNEYS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {presets.map(renderPreset)}
            </ScrollView>

            {/* Mood chips */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HOW ARE YOU FEELING?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScroll}>
              {MOODS.map(mood => {
                const active = selectedMood === mood && !heroSubtitle;
                const mh     = MOOD_HERO[mood] || DEFAULT_MOOD_HERO;
                return (
                  <TouchableOpacity
                    key={mood}
                    style={[styles.moodChip, { backgroundColor: active ? mh.colors[0] : colors.glass, borderColor: active ? mh.accent : colors.border }]}
                    onPress={() => handleMoodSelect(mood)}
                  >
                    <Text style={[styles.moodChipText, { color: active ? mh.accent : colors.textMuted }]}>
                      {moodEmoji(mood)} {mood}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Track list header */}
            {playlist.length > 0 && (
              <View style={styles.trackListHeader}>
                <Text style={[styles.listHeader, { color: colors.textMuted }]}>
                  {playlist.length} NAMES · {heroTitle.toUpperCase()}
                </Text>
                {/* Play mode indicator */}
                <View style={[styles.playModeBadge, { borderColor: colors.border }]}>
                  <Ionicons name={playMode === 'guided' ? 'leaf' : 'musical-notes'} size={10} color={colors.textMuted} />
                  <Text style={[styles.playModeText, { color: colors.textMuted }]}>
                    {playMode === 'guided' ? 'Guided' : 'Normal'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          isLoading
            ? <View style={styles.center}><ActivityIndicator color="#2D6A4F" /></View>
            : (
              <View style={styles.empty}>
                <Ionicons name="musical-notes-outline" size={44} color={colors.textDimmed} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {allNames.length === 0 ? 'Names are loading. Check your connection.' : 'No names curated for this mood yet.'}
                </Text>
              </View>
            )
        )}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  // ── Hero ──
  hero: { paddingTop: SPACE.md, paddingBottom: SPACE.lg, paddingHorizontal: SPACE.lg, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  heroBgCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -60 },
  heroBgCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(255,255,255,0.03)', bottom: -40, left: -40 },

  // ── Mosque ──
  mosqueWrap: { width: 96, height: 72, alignItems: 'center', marginBottom: SPACE.sm, position: 'relative' },
  dome:       { position: 'absolute', top: 0, width: 44, height: 26, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center' },
  mosqueBody: { position: 'absolute', bottom: 0, width: 64, height: 28, backgroundColor: 'rgba(255,255,255,0.18)', borderTopLeftRadius: 4, borderTopRightRadius: 4, alignSelf: 'center' },
  archWindow: { position: 'absolute', bottom: 8, width: 14, height: 18, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center' },
  minaret:    { position: 'absolute', bottom: 0, width: 10, height: 46, backgroundColor: 'rgba(255,255,255,0.18)', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  minaretCap: { position: 'absolute', top: -8, left: -2, width: 14, height: 10, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: 'rgba(255,255,255,0.28)' },
  star:       { position: 'absolute', fontSize: 8, color: 'rgba(255,255,255,0.45)' },

  // ── Hero text ──
  playlistTitle: { fontFamily: FONTS.bold, fontSize: SIZES.xl, color: '#FFF', letterSpacing: 0.3, textAlign: 'center', marginBottom: 4 },
  heroSubtitle:  { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.55)', marginBottom: SPACE.md, textAlign: 'center' },
  heroMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACE.md },
  heroMetaText:  { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' },
  heroMetaDot:   { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.3)' },

  // ── Now playing ──
  nowPlaying:           { alignItems: 'center', marginBottom: SPACE.md, paddingHorizontal: SPACE.md },
  nowPlayingArabic:     { fontFamily: 'Amiri-Regular', fontSize: 34, color: 'rgba(255,255,255,0.92)' },
  nowPlayingTrans:      { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3, marginTop: 2 },
  nowPlayingMeaning:    { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.48)', marginTop: 3, letterSpacing: 0.2 },
  nowPlayingReflection: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8, textAlign: 'center', fontStyle: 'italic', lineHeight: 16, paddingHorizontal: SPACE.sm },

  // ── Waveform ──
  waveform: { flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 3, marginBottom: SPACE.lg, width: '90%', justifyContent: 'center' },

  // ── Controls ──
  controls:  { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  ctrlBtn:   { padding: 6 },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },

  // ── List body ──
  listContent: { paddingHorizontal: SPACE.md, paddingTop: SPACE.md, gap: SPACE.sm },

  // ── Banners ──
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, marginBottom: SPACE.sm },
  bannerText:    { flex: 1 },
  bannerTitle:   { fontFamily: FONTS.bold, fontSize: SIZES.sm },
  bannerSub:     { fontSize: SIZES.xs, marginTop: 1 },
  bannerBtn:     { paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full },
  bannerBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Daily card ──
  dailyCard:     { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACE.md },
  dailyGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACE.md, borderRadius: RADIUS.lg },
  dailyLabel:    { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  dailyTitle:    { fontFamily: FONTS.bold, fontSize: SIZES.md, color: '#FFF' },
  dailySub:      { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  dailyPlayBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginLeft: SPACE.md },

  // ── Preset cards ──
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: SPACE.sm, marginTop: SPACE.md },
  presetScroll: { gap: SPACE.sm, paddingBottom: SPACE.sm },
  presetCard:   { width: 150, borderRadius: RADIUS.lg, padding: SPACE.md, marginRight: 2, position: 'relative', overflow: 'hidden' },
  presetEmoji:  { fontSize: 26, marginBottom: 6 },
  presetTitle:  { fontFamily: FONTS.bold, fontSize: SIZES.sm, color: '#FFF', marginBottom: 2 },
  presetSub:    { fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 14 },
  presetAccentDot: { position: 'absolute', bottom: 10, right: 10, width: 8, height: 8, borderRadius: 4 },

  // ── Mood chips ──
  moodScroll:    { gap: 8, paddingBottom: SPACE.sm },
  moodChip:      { paddingVertical: 7, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1 },
  moodChipText:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  // ── Track list header ──
  trackListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.sm, marginTop: SPACE.md },
  listHeader:      { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  playModeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.full, paddingVertical: 3, paddingHorizontal: 8 },
  playModeText:    { fontSize: 10, fontWeight: '600' },

  // ── Track rows ──
  trackRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: SPACE.sm + 2, paddingHorizontal: SPACE.sm, gap: SPACE.sm },
  trackIdx:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  trackIdxText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  trackArabic:  { fontFamily: 'Amiri-Regular', fontSize: 26, width: 52, textAlign: 'center' },
  trackMeta:    { flex: 1, gap: 2 },
  trackTrans:   { fontFamily: 'Inter-Bold', fontSize: SIZES.sm, letterSpacing: 0.1 },
  trackMeaning: { fontSize: SIZES.xs, lineHeight: 16 },
  trackFavBtn:  { padding: 4 },
  trackPlayBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Empty ──
  empty:     { paddingTop: 60, alignItems: 'center', gap: SPACE.md },
  emptyText: { fontSize: SIZES.sm, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});

export default PlaylistScreen;
