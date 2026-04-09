import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS, SPACE, RADIUS } from '../theme';

const { width: SW } = Dimensions.get('window');
const FLIP_MS  = 580;
const SPINE_W  = 10;

// ─── Data helpers ─────────────────────────────────────────────────────────────
const getField = (name, ...keys) => {
  for (const key of keys) {
    if (name[key] !== undefined && name[key] !== null && name[key] !== '') return name[key];
  }
  return null;
};

const parseBenefits = (name) => {
  const raw = getField(name, 'benefits_of_learning', 'benefits');
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(/\.\s+/).filter(Boolean);
};

const parseQuranicRefs = (name) => {
  const raw = getField(name, 'quranic_references', 'quranicReferences');
  if (Array.isArray(raw) && raw.length > 0) return raw;
  const arabic      = getField(name, 'quranicAyah', 'ayah');
  const translation = getField(name, 'quranicTranslation', 'ayahTranslation');
  const reference   = getField(name, 'quranicReference', 'surahReference', 'reference');
  if (arabic || translation) return [{ arabic, translation, reference }];
  return [];
};

// ─── NameDetailScreen ─────────────────────────────────────────────────────────
//
// Book architecture
// ─────────────────
// bookWrapper  ← drop-shadow "table" behind the book
//   bookBody   ← rounded rectangle, clips everything
//     spine    ← golden gradient strip on the left edge
//     pagesArea ← overflow: hidden  ← all pages live here
//       {static page | departing + arriving Animated.View pair}
//       foldShadowStrip  ← 60px gradient crease that sweeps across during flip
//       pageEdge         ← thin right-edge darkening for 3D depth (always visible)
//
// Flip mechanics
// ──────────────
// Forward  (next):  departing  0° → -90°,  arriving  +90° → 0°,  shadow R→L
// Backward (prev):  departing  0° → +90°,  arriving  -90° → 0°,  shadow L→R
//
// Navigation: prev/next arrow buttons + tappable pagination dots
//
const NameDetailScreen = ({ route, navigation }) => {
  const { name }                                            = route.params;
  const { markAsLearned, learnedIds, masteredIds, revisitCounts } = useNames();
  const { colors, isDark }                                  = useAppTheme();

  // quiz state
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback,   setShowFeedback]   = useState(false);

  // page-flip state
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPageIdx, setNextPageIdx] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const flipDirRef      = useRef(1);   // 1 = forward, -1 = backward
  const currentPageRef  = useRef(0);
  const flipAnim        = useRef(new Animated.Value(0)).current;

  const isLearned    = learnedIds.includes(name.number);
  const isMastered   = masteredIds.includes(name.number);
  const revisitCount = revisitCounts?.[name.number] ?? revisitCounts?.[String(name.number)] ?? 0;

  const benefits       = parseBenefits(name);
  const quranicRefs    = parseQuranicRefs(name);
  const reflection     = getField(name, 'reflection', 'learning_insight', 'learningInsight', 'description');
  const learningInsight = getField(name, 'learning_insight', 'learningInsight', 'reflection', 'description');

  const mcq = useMemo(() => {
    const raw = getField(name, 'match_the_quality', 'matchTheQuality', 'mcq');
    if (raw) return Array.isArray(raw) ? raw[0] : raw;
    return {
      q:    `What is the primary significance of ${name.transliteration}?`,
      opts: [name.meaning, 'The Creator', 'The Judge', 'The Healer'],
      ans:  0,
    };
  }, [name]);

  const slides = useMemo(() => {
    const s = [{ id: 'hero' }];
    if (benefits.length > 0)                                                              s.push({ id: 'benefits' });
    if (quranicRefs.filter(r => r.arabic || r.translation).length > 0)                   s.push({ id: 'quran' });
    if (reflection)                                                                       s.push({ id: 'reflection' });
    if (learningInsight && learningInsight !== reflection)                                s.push({ id: 'insight' });
    
    // Add dynamic learning cards from the database
    if (name.learningCards && Array.isArray(name.learningCards)) {
      name.learningCards.forEach(card => {
        s.push({ id: `dynamic_${card.id}`, type: 'dynamic', data: card });
      });
    }

    s.push({ id: 'mcq' });
    s.push({ id: 'progress' });
    return s;
  }, [benefits, quranicRefs, reflection, learningInsight, name.learningCards]);

  // ── Flip logic ──────────────────────────────────────────────────────────────
  const flipToPage = useCallback((targetIdx) => {
    if (isAnimating || targetIdx < 0 || targetIdx >= slides.length) return;
    const dir = targetIdx > currentPageRef.current ? 1 : -1;
    flipDirRef.current = dir;
    flipAnim.setValue(0);
    setNextPageIdx(targetIdx);
    setIsAnimating(true);
    Animated.timing(flipAnim, { toValue: 1, duration: FLIP_MS, useNativeDriver: true }).start(() => {
      currentPageRef.current = targetIdx;
      setCurrentPage(targetIdx);
      setNextPageIdx(null);
      setIsAnimating(false);
    });
  }, [isAnimating, slides.length]);

  // ── Quiz ────────────────────────────────────────────────────────────────────
  const handleOptionPress = useCallback((index) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    if (index === mcq.ans) {
      markAsLearned(name.number);
      Toast.show({ type: 'success', text1: 'Excellent!', text2: 'Your progress has been updated.', visibilityTime: 2500 });
    } else {
      Toast.show({ type: 'error', text1: 'Not quite!', text2: 'Keep studying and try again.', visibilityTime: 2500 });
    }
  }, [showFeedback, mcq.ans, name.number, markAsLearned]);

  const handleMarkLearned = useCallback(async () => {
    await markAsLearned(name.number);
    Toast.show({ type: 'success', text1: 'Marked as Learned', text2: `${name.transliteration} added to your progress.`, visibilityTime: 2000 });
  }, [markAsLearned, name]);

  // ── Animated styles (recomputed each render with current flipDir ref) ────────
  const dir = flipDirRef.current;

  const departingOpacity  = flipAnim.interpolate({ inputRange: [0, 0.44, 0.5], outputRange: [1, 1, 0],           extrapolate: 'clamp' });
  const departingRotateY  = flipAnim.interpolate({ inputRange: [0, 0.5,  1],   outputRange: dir > 0 ? ['0deg','-90deg','-90deg'] : ['0deg','90deg','90deg'] });
  const arrivingOpacity   = flipAnim.interpolate({ inputRange: [0, 0.5,  0.56], outputRange: [0, 0, 1],           extrapolate: 'clamp' });
  const arrivingRotateY   = flipAnim.interpolate({ inputRange: [0, 0.5,  1],   outputRange: dir > 0 ? ['90deg','90deg','0deg'] : ['-90deg','-90deg','0deg'] });
  const foldOpacity       = flipAnim.interpolate({ inputRange: [0, 0.1,  0.9,  1], outputRange: [0, 0.9, 0.9, 0] });
  const foldTranslateX    = flipAnim.interpolate({ inputRange: [0, 1], outputRange: dir > 0 ? [SW - 30, -30] : [-(SW - 30), 30] });

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                    PAGE RENDERERS                           ║
  // ╚══════════════════════════════════════════════════════════════╝

  // ── PAGE 1: HERO ──────────────────────────────────────────────────────────
  // Design: Title-page of a sacred manuscript.
  //   - Warm black/golden background
  //   - Massive Arabic calligraphy as the centrepiece
  //   - Roman-numeral-style number badge
  //   - Ornamental divider with diamond glyph
  //   - Category chip at bottom
  const renderHeroPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#0b0704', '#170e04'] : ['#fffaeb', '#f5edcc']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient central glow */}
      <View style={[styles.heroGlow, { backgroundColor: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.1)' }]} />

      <ScrollView contentContainerStyle={styles.heroPage} showsVerticalScrollIndicator={false}>
        {/* Top label */}
        <Text style={[styles.pageLabel, { color: isDark ? 'rgba(201,168,76,0.28)' : 'rgba(130,100,30,0.35)' }]}>
          THE BEAUTIFUL NAMES
        </Text>

        {/* Number badge */}
        <View style={[styles.heroBadge, { borderColor: isDark ? 'rgba(201,168,76,0.22)' : 'rgba(180,140,40,0.28)' }]}>
          <Text style={[styles.heroNumeral, { color: isDark ? 'rgba(201,168,76,0.55)' : 'rgba(130,100,30,0.5)' }]}>
            {String(name.number).padStart(2, '0')}
          </Text>
        </View>

        {/* Massive Arabic */}
        <Text style={[styles.heroArabic, { color: colors.primary }]}>{name.arabic}</Text>

        {/* Ornamental divider */}
        <View style={styles.ornamentRow}>
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
          <Ionicons name="diamond" size={7} color={colors.primary} style={{ opacity: 0.45 }} />
          <Ionicons name="diamond" size={5} color={colors.primary} style={{ opacity: 0.25, marginHorizontal: -2 }} />
          <Ionicons name="diamond" size={7} color={colors.primary} style={{ opacity: 0.45 }} />
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
        </View>

        {/* Transliteration */}
        <Text style={[styles.heroTrans, { color: colors.text }]}>{name.transliteration}</Text>

        {/* Meaning */}
        <Text style={[styles.heroMeaning, { color: colors.textMuted }]}>{name.meaning}</Text>

        {/* Category */}
        {!!name.category && (
          <View style={[styles.categoryChip, { borderColor: isDark ? 'rgba(201,168,76,0.18)' : 'rgba(160,120,40,0.22)' }]}>
            <Text style={[styles.categoryText, { color: isDark ? 'rgba(201,168,76,0.45)' : 'rgba(130,100,30,0.5)' }]}>
              {name.category.toUpperCase()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ── PAGE 2: BENEFITS ──────────────────────────────────────────────────────
  // Design: Warm amber manuscript — "The Gifts".
  //   - Two-digit index with subtle card + accent left border
  //   - Gift/lantern icon
  const renderBenefitsPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#0a0602', '#1a0e04'] : ['#fffaed', '#f8f0d5']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.1)' }]}>
            <Ionicons name="gift" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Gifts of This Name</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            What learning {name.transliteration} brings to your life
          </Text>
        </View>

        <View style={styles.benefitsList}>
          {benefits.map((benefit, idx) => (
            <View key={idx} style={[styles.benefitCard, {
              backgroundColor: isDark ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.06)',
              borderColor:     isDark ? 'rgba(201,168,76,0.1)'  : 'rgba(201,168,76,0.18)',
              borderLeftColor: colors.primary,
            }]}>
              <Text style={[styles.benefitIdx, { color: colors.primary }]}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ── PAGE 3: QUR'AN ────────────────────────────────────────────────────────
  // Design: Deep cosmic night — "Divine Words".
  //   - Tiny star field (View dots at pseudo-random positions)
  //   - Large opening " watermark
  //   - Arabic ayah right-aligned in violet
  //   - Translation in italic
  //   - Surah reference badge
  const STARS = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      top:  `${(i * 6.1 + 4) % 90}%`,
      left: `${(i * 14.7 + 6) % 88}%`,
      size: i % 3 === 0 ? 3 : 2,
      opacity: 0.06 + (i % 5) * 0.03,
    })), []);

  const renderQuranPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#040412', '#080820'] : ['#eeeeff', '#e0e0f8']}
        style={StyleSheet.absoluteFillObject}
      />
      {STARS.map((s, i) => (
        <View key={i} style={[styles.star, {
          top: s.top, left: s.left, width: s.size, height: s.size,
          opacity: s.opacity,
          backgroundColor: isDark ? '#c9a84c' : '#6060c0',
        }]} />
      ))}
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: 'rgba(139,92,246,0.08)' }]}>
            <Ionicons name="book" size={26} color="#8b5cf6" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Divine Words</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Qur'anic references to this name
          </Text>
        </View>

        {quranicRefs.map((ref, idx) => (
          <View key={idx} style={[styles.quranBlock, {
            backgroundColor: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(100,60,200,0.04)',
            borderColor:     isDark ? 'rgba(139,92,246,0.14)' : 'rgba(100,60,200,0.12)',
          }, idx > 0 && { marginTop: SPACE.xl }]}>

            {/* Big open-quote watermark */}
            <Text style={[styles.bigQuote, { color: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(100,60,200,0.08)' }]}>"</Text>

            {!!ref.arabic && (
              <Text style={[styles.quranArabic, { color: isDark ? '#b8a4f4' : '#6050c0' }]}>
                {ref.arabic}
              </Text>
            )}
            {!!ref.translation && (
              <Text style={[styles.quranTrans, { color: colors.text }]}>
                "{ref.translation}"
              </Text>
            )}
            {!!ref.reference && (
              <View style={[styles.quranBadge, { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.22)' }]}>
                <Ionicons name="location-outline" size={11} color="#8b5cf6" />
                <Text style={[styles.quranRef, { color: '#8b5cf6' }]}>{ref.reference}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ── PAGE 4: REFLECTION ────────────────────────────────────────────────────
  // Design: Midnight contemplation — "Ponder & Reflect".
  //   - Deep indigo-purple bg
  //   - Moon icon
  //   - Large decorative quotes as text watermarks
  //   - Italic reflection body, centred
  const renderReflectionPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#060410', '#0e0820'] : ['#f5f0ff', '#ece4fc']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={[styles.sectionPage, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: isDark ? 'rgba(201,168,76,0.07)' : 'rgba(180,140,40,0.08)' }]}>
            <Ionicons name="moon" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Ponder & Reflect</Text>
        </View>

        <View style={[styles.quoteBox, {
          backgroundColor: isDark ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.05)',
          borderColor:     isDark ? 'rgba(201,168,76,0.1)'  : 'rgba(180,140,40,0.14)',
        }]}>
          <Text style={[styles.openQuote,  { color: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,30,0.12)' }]}>"</Text>
          <Text style={[styles.quoteBody,  { color: colors.text }]}>{reflection}</Text>
          <Text style={[styles.closeQuote, { color: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,30,0.12)' }]}>"</Text>
        </View>
      </ScrollView>
    </View>
  );

  // ── PAGE 5: INSIGHT ───────────────────────────────────────────────────────
  // Design: Emerald study — "Learning Insight".
  //   - Deep forest-green tint
  //   - School icon
  //   - Teal left-border card
  const renderInsightPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#020a06', '#04140a'] : ['#ecfdf5', '#d8f8e8']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={[styles.sectionPage, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: 'rgba(45,156,150,0.08)' }]}>
            <Ionicons name="school" size={26} color="#2d9c96" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Learning Insight</Text>
        </View>

        <View style={[styles.insightBox, {
          backgroundColor: isDark ? 'rgba(45,156,150,0.04)' : 'rgba(45,156,150,0.06)',
          borderColor:     isDark ? 'rgba(45,156,150,0.12)' : 'rgba(45,156,150,0.2)',
          borderLeftColor: '#2d9c96',
        }]}>
          <Text style={[styles.quoteBody, { color: colors.text }]}>{learningInsight}</Text>
        </View>
      </ScrollView>
    </View>
  );

  // ── PAGE 6: MCQ ───────────────────────────────────────────────────────────
  // Design: Indigo challenge arena — "Match the Quality".
  //   - Deep indigo bg
  //   - Lightning badge
  //   - A/B/C/D labelled options with colour feedback
  const renderMcqPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#06041a', '#0a081e'] : ['#f2f0ff', '#e6e2fc']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: isDark ? 'rgba(201,168,76,0.07)' : 'rgba(201,168,76,0.09)' }]}>
            <Ionicons name="flash" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Match the Quality</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Test your understanding of{' '}
            <Text style={{ color: colors.text, fontStyle: 'normal', fontWeight: '700' }}>{name.transliteration}</Text>
          </Text>
        </View>

        {/* Question box */}
        <View style={[styles.mcqBox, {
          backgroundColor: isDark ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.05)',
          borderColor:     isDark ? 'rgba(201,168,76,0.1)'  : 'rgba(201,168,76,0.18)',
        }]}>
          <Text style={[styles.mcqQ, { color: colors.text }]}>{mcq.q}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {(mcq.opts || []).map((opt, idx) => {
            const isCorrect     = idx === mcq.ans;
            const isWrongChoice = showFeedback && selectedOption === idx && !isCorrect;
            const isRevealOk    = showFeedback && isCorrect;
            const isChosen      = !showFeedback && selectedOption === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleOptionPress(idx)}
                disabled={showFeedback}
                activeOpacity={0.75}
                style={[
                  styles.mcqOption,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                  isChosen    && { backgroundColor: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.35)' },
                  isRevealOk  && { backgroundColor: 'rgba(45,156,150,0.1)',  borderColor: 'rgba(45,156,150,0.35)' },
                  isWrongChoice && { backgroundColor: 'rgba(255,68,68,0.1)', borderColor: 'rgba(255,68,68,0.35)'  },
                ]}
              >
                <View style={[styles.mcqLetter, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  ...(isRevealOk   && { backgroundColor: 'rgba(45,156,150,0.15)' }),
                  ...(isWrongChoice && { backgroundColor: 'rgba(255,68,68,0.15)'  }),
                }]}>
                  <Text style={[styles.mcqLetterTxt, { color: colors.textMuted },
                    isRevealOk   && { color: '#2d9c96' },
                    isWrongChoice && { color: '#ff4444' },
                  ]}>
                    {['A','B','C','D'][idx]}
                  </Text>
                </View>
                <Text style={[styles.mcqOptTxt, { color: colors.text },
                  isRevealOk   && { color: '#2d9c96', fontWeight: '700' },
                  isWrongChoice && { color: '#ff4444' },
                ]}>
                  {opt}
                </Text>
                {isRevealOk   && <Ionicons name="checkmark-circle" size={20} color="#2d9c96" />}
                {isWrongChoice && <Ionicons name="close-circle"     size={20} color="#ff4444" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ── PAGE 7: PROGRESS ─────────────────────────────────────────────────────
  // Design: Galaxy achievement page — "Your Journey".
  //   - Midnight bg with subtle star field
  //   - Two large bordered rings (Learned / Mastered)
  //   - Revisit progress bar
  const PROGRESS_STARS = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      top:  `${(i * 4.2 + 2) % 96}%`,
      left: `${(i * 11.8 + 4) % 94}%`,
      size: i % 5 === 0 ? 3 : 2,
      opacity: 0.05 + (i % 6) * 0.02,
    })), []);

  const renderProgressPage = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#020410', '#060818'] : ['#eef0ff', '#dde2fc']}
        style={StyleSheet.absoluteFillObject}
      />
      {PROGRESS_STARS.map((s, i) => (
        <View key={i} style={[styles.star, {
          top: s.top, left: s.left, width: s.size, height: s.size,
          opacity: s.opacity,
          backgroundColor: isDark ? '#c9a84c' : '#8080c8',
        }]} />
      ))}

      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: isDark ? 'rgba(201,168,76,0.07)' : 'rgba(201,168,76,0.09)' }]}>
            <Ionicons name="trophy" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Your Journey</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Track your mastery of {name.transliteration}
          </Text>
        </View>

        {/* Learned / Mastered cards */}
        <View style={styles.progressCards}>
          {/* Learned */}
          <TouchableOpacity
            onPress={handleMarkLearned}
            style={[styles.progressCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderColor: isLearned
                ? 'rgba(45,156,150,0.4)'
                : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'),
              ...(isLearned && { backgroundColor: 'rgba(45,156,150,0.07)' }),
            }]}
          >
            <View style={[styles.progressRing, {
              borderColor: isLearned ? '#2d9c96' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
              backgroundColor: isLearned ? 'rgba(45,156,150,0.08)' : 'transparent',
            }]}>
              <Ionicons
                name={isLearned ? 'checkmark-circle' : 'ellipse-outline'}
                size={38}
                color={isLearned ? '#2d9c96' : colors.textDimmed}
              />
            </View>
            <Text style={[styles.progressCardTitle, { color: isLearned ? '#2d9c96' : colors.text }]}>Learned</Text>
            <Text style={[styles.progressCardSub, { color: colors.textMuted }]}>
              {isLearned ? 'Completed ✓' : 'Tap to mark'}
            </Text>
          </TouchableOpacity>

          {/* Mastered */}
          <View style={[styles.progressCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderColor: isMastered
              ? 'rgba(201,168,76,0.4)'
              : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'),
            ...(isMastered && { backgroundColor: 'rgba(201,168,76,0.07)' }),
          }]}>
            <View style={[styles.progressRing, {
              borderColor: isMastered ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
              backgroundColor: isMastered ? 'rgba(201,168,76,0.08)' : 'transparent',
            }]}>
              <Ionicons
                name={isMastered ? 'ribbon' : 'ribbon-outline'}
                size={38}
                color={isMastered ? colors.primary : colors.textDimmed}
              />
            </View>
            <Text style={[styles.progressCardTitle, { color: isMastered ? colors.primary : colors.text }]}>Mastered</Text>
            <Text style={[styles.progressCardSub, { color: colors.textMuted }]}>
              {revisitCount} / 3 revisits
            </Text>
          </View>
        </View>

        {/* Revisit progress bar */}
        <View style={[styles.revisitWrap, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
          borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        }]}>
          <View style={styles.revisitTop}>
            <Ionicons name="repeat" size={13} color={colors.textMuted} />
            <Text style={[styles.revisitLabel, { color: colors.textMuted }]}>MASTERY PROGRESS</Text>
            <Text style={[styles.revisitCount, { color: colors.primary }]}>{revisitCount}/3</Text>
          </View>
          <View style={[styles.revisitTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={[styles.revisitFill, {
              backgroundColor: colors.primary,
              width: `${Math.min(revisitCount / 3, 1) * 100}%`,
            }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // ── PAGE 8: DYNAMIC LEARNING CARD ─────────────────────────────────────────
  // Design: Ramadan Mubarak styled card.
  //   - Crescent moon and lanterns at the top.
  //   - Arabic watermark underneath the moon.
  //   - Golden title text and diamond separator.
  //   - Lower section intersecting a geometric pattern.
  const renderDynamicCardPage = (card) => (
    <View style={{ flex: 1, backgroundColor: isDark ? '#14120D' : '#FDFBF7' }}>
      {/* Background Bottom Pattern Area */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', backgroundColor: isDark ? '#0c0b08' : '#F8F4EA' }}>
         <View style={{flexDirection: 'row', flexWrap: 'wrap', opacity: 0.1, justifyContent: 'center'}}>
            {Array.from({length: 80}).map((_, i) => (
               <View key={i} style={{width: 30, height: 30, borderWidth: 1, borderColor: '#c9a84c', transform: [{rotate: '45deg'}], margin: -5}} />
            ))}
         </View>
      </View>

      <ScrollView contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false}>
        {/* The White Overlay Frame with Arch */}
        <View style={{
          backgroundColor: isDark ? '#14120D' : '#FDFBF7',
          flex: 1,
          borderBottomLeftRadius: 60,
          borderBottomRightRadius: 60,
          borderBottomWidth: 4,
          borderBottomColor: '#c9a84c30',
          paddingBottom: 50,
          marginBottom: 30,
          paddingHorizontal: 24,
          alignItems: 'center',
          shadowColor: '#000', shadowOffset: {width: 0, height: 15}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
        }}>
           {/* Hanging Lanterns */}
            <View style={{ position: 'absolute', top: -10, left: 30, alignItems: 'center' }}>
              <View style={{ width: 1, height: 60, backgroundColor: '#c9a84c' }} />
              <View style={{ width: 14, height: 20, backgroundColor: '#c9a84c', borderRadius: 3 }} />
              <View style={{ width: 22, height: 6, backgroundColor: '#c9a84c', borderRadius: 2, marginTop: -2 }} />
            </View>
            <View style={{ position: 'absolute', top: -20, right: 30, alignItems: 'center' }}>
              <View style={{ width: 1, height: 90, backgroundColor: '#c9a84c' }} />
              <View style={{ width: 14, height: 20, backgroundColor: '#c9a84c', borderRadius: 3 }} />
              <View style={{ width: 22, height: 6, backgroundColor: '#c9a84c', borderRadius: 2, marginTop: -2 }} />
            </View>

            {/* Crescent */}
            <View style={{ marginTop: 70, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#c9a84c', overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: -12, right: 12, width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? '#14120D' : '#FDFBF7' }} />
              </View>
            </View>

            {/* Calligraphy */}
            <Text style={{ fontFamily: FONTS.arabic, fontSize: 44, color: '#c9a84c', textAlign: 'center', marginTop: 15 }}>
              {name.arabic}
            </Text>

            {/* Title */}
            <Text style={{ fontSize: 18, fontFamily: FONTS.regular, color: '#c9a84c', textAlign: 'center', marginTop: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
              {card.title}
            </Text>

            {/* Diamond Separator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 18 }}>
               <View style={{ height: 1, width: 50, backgroundColor: '#c9a84c', opacity: 0.5 }} />
               <Ionicons name="diamond" size={7} color="#c9a84c" style={{ marginHorizontal: 8 }} />
               <View style={{ height: 1, width: 50, backgroundColor: '#c9a84c', opacity: 0.5 }} />
            </View>

            {/* Content */}
            <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: isDark ? 'rgba(255,255,255,0.7)' : '#666', textAlign: 'center', lineHeight: 22 }}>
              {card.content}
            </Text>
        </View>
      </ScrollView>
    </View>
  );

  // ── Page dispatcher ────────────────────────────────────────────────────────
  const renderPage = (slide) => {
    if (!slide) return null;
    if (slide.type === 'dynamic') return renderDynamicCardPage(slide.data);

    switch (slide.id) {
      case 'hero':       return renderHeroPage();
      case 'benefits':   return renderBenefitsPage();
      case 'quran':      return renderQuranPage();
      case 'reflection': return renderReflectionPage();
      case 'insight':    return renderInsightPage();
      case 'mcq':        return renderMcqPage();
      case 'progress':   return renderProgressPage();
      default:           return null;
    }
  };

  const PAGE_LABELS = { hero: 'Title', benefits: 'Gifts', quran: "Qur'ān", reflection: 'Reflect', insight: 'Insight', mcq: 'Quiz', progress: 'Progress' };
  const getPageLabel = (slide) => {
    if (!slide) return '';
    if (slide.type === 'dynamic') return slide.data.title || 'Insight';
    return PAGE_LABELS[slide.id] || '';
  };

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Ambient room background */}
      <LinearGradient
        colors={isDark ? ['rgba(10,8,18,1)', 'rgba(2,2,8,1)'] : [colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.glass }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerArabic, { color: colors.primary }]}>{name.arabic}</Text>
          </View>

          <TouchableOpacity
            onPress={handleMarkLearned}
            style={[styles.learnBtn, { backgroundColor: colors.glass, borderColor: colors.borderStrong }, isLearned && styles.learnBtnActive]}
          >
            <Ionicons name={isLearned ? 'checkmark-circle' : 'add-circle-outline'} size={15} color={isLearned ? '#2d9c96' : colors.textMuted} />
            <Text style={[styles.learnBtnText, { color: colors.textMuted }, isLearned && { color: '#2d9c96' }]}>
              {isLearned ? 'LEARNED' : 'MARK'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Book ── */}
        <View style={styles.bookWrapper}>

          {/* Dropped shadow behind the book */}
          <View style={[styles.bookShadow, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.1)' }]} />

          {/* Book body */}
          <View style={[styles.bookBody, { borderColor: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.2)' }]}>

            {/* Spine */}
            <LinearGradient
              colors={['rgba(201,168,76,0.6)', 'rgba(140,100,30,0.9)', 'rgba(201,168,76,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.spine}
            />

            {/* Pages area (clips fold shadow + page transforms) */}
            <View style={styles.pagesArea}>

              {/* Static page (not animating) */}
              {!isAnimating && (
                <View style={StyleSheet.absoluteFillObject}>
                  {renderPage(slides[currentPage])}
                </View>
              )}

              {/* Page-flip animation */}
              {isAnimating && (
                <>
                  {/* Departing page — folds away */}
                  <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFillObject, {
                      opacity: departingOpacity,
                      transform: [{ perspective: 1400 }, { rotateY: departingRotateY }],
                    }]}
                  >
                    {renderPage(slides[currentPage])}
                  </Animated.View>

                  {/* Arriving page — sweeps in */}
                  <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFillObject, {
                      opacity: arrivingOpacity,
                      transform: [{ perspective: 1400 }, { rotateY: arrivingRotateY }],
                    }]}
                  >
                    {renderPage(slides[nextPageIdx])}
                  </Animated.View>

                  {/* Fold shadow crease */}
                  <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
                    <Animated.View style={[styles.foldShadowStrip, { opacity: foldOpacity, transform: [{ translateX: foldTranslateX }] }]}>
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.28)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>
                  </View>
                </>
              )}

              {/* Constant right-edge depth shadow (3-D depth illusion) */}
              <View style={styles.pageEdge} pointerEvents="none">
                <LinearGradient
                  colors={['transparent', isDark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.07)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Navigation footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => flipToPage(currentPage - 1)}
            disabled={isAnimating || currentPage === 0}
            style={[styles.navBtn, { opacity: (isAnimating || currentPage === 0) ? 0.2 : 1 }]}
          >
            <Ionicons name="chevron-back-circle" size={30} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {slides.map((s, idx) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => flipToPage(idx)}
                disabled={isAnimating}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View style={[styles.dot, {
                  backgroundColor: idx === currentPage
                    ? colors.primary
                    : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                  width: idx === currentPage ? 22 : 6,
                }]} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => flipToPage(currentPage + 1)}
            disabled={isAnimating || currentPage === slides.length - 1}
            style={[styles.navBtn, { opacity: (isAnimating || currentPage === slides.length - 1) ? 0.2 : 1 }]}
          >
            <Ionicons name="chevron-forward-circle" size={30} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Page label + counter */}
        <Text style={[styles.pageCounter, { color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)' }]}>
          {getPageLabel(slides[currentPage])}  ·  {currentPage + 1} of {slides.length}
        </Text>

      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACE.md, height: 64,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: SPACE.sm },
  headerArabic: { fontFamily: FONTS.arabic, fontSize: 30 },
  learnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  learnBtnActive: { backgroundColor: 'rgba(45,156,150,0.12)', borderColor: 'rgba(45,156,150,0.4)' },
  learnBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // Book structure
  bookWrapper: { flex: 1, marginHorizontal: SPACE.md, marginBottom: SPACE.sm },
  bookShadow: { position: 'absolute', bottom: -7, left: 12, right: -5, top: 7, borderRadius: RADIUS.xl },
  bookBody: { flex: 1, flexDirection: 'row', borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1 },
  spine:    { width: SPINE_W },
  pagesArea: { flex: 1, overflow: 'hidden' },

  // Fold shadow strip (narrow vertical gradient that sweeps across)
  foldShadowStrip: { position: 'absolute', top: 0, bottom: 0, width: 60, left: 0 },

  // Constant right-edge page depth shadow
  pageEdge: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 18 },

  // Navigation footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACE.md, paddingVertical: 6,
  },
  navBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  dotsRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  pageCounter: { textAlign: 'center', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: SPACE.sm },

  // ── Hero page ──
  heroGlow: {
    position: 'absolute', borderRadius: 9999,
    top: '18%', left: '8%', right: '8%', height: '65%',
  },
  heroPage: { alignItems: 'center', paddingVertical: SPACE.xxl, paddingHorizontal: SPACE.xl },
  pageLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3.5, marginBottom: SPACE.xl },
  heroBadge: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 7, marginBottom: SPACE.xl },
  heroNumeral: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 4 },
  heroArabic: { fontFamily: FONTS.arabic, fontSize: 90, textAlign: 'center', lineHeight: 115 },
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACE.lg },
  ornamentLine: { flex: 1, height: 1 },
  heroTrans: { fontFamily: FONTS.bold, fontSize: 34, textAlign: 'center' },
  heroMeaning: {
    fontFamily: FONTS.regular, fontSize: 20, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 30, marginTop: SPACE.sm, paddingHorizontal: SPACE.sm,
  },
  categoryChip: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 5, marginTop: SPACE.xl },
  categoryText: { fontSize: 9, fontWeight: '900', letterSpacing: 2.2 },

  // ── Generic section page layout ──
  sectionPage: { padding: SPACE.xl, paddingBottom: SPACE.xxl },
  pageHeader:  { alignItems: 'center', marginBottom: SPACE.xxl },
  pageIconCircle: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.md },
  pageTitle:    { fontFamily: FONTS.bold, fontSize: 26, textAlign: 'center', marginBottom: SPACE.xs },
  pageSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.8 },

  // ── Benefits ──
  benefitsList: { gap: SPACE.md },
  benefitCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md,
    padding: SPACE.md, borderRadius: RADIUS.lg, borderWidth: 1, borderLeftWidth: 3,
  },
  benefitIdx:  { fontFamily: FONTS.bold, fontSize: 14, fontWeight: '900', minWidth: 24, marginTop: 2 },
  benefitText: { flex: 1, fontSize: 16, lineHeight: 24, fontWeight: '500' },

  // ── Qur'an ──
  star: { position: 'absolute', borderRadius: 99 },
  quranBlock: { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1 },
  bigQuote: { fontSize: 70, lineHeight: 54, fontWeight: '900', marginBottom: SPACE.sm },
  quranArabic: { fontFamily: FONTS.arabic, fontSize: 28, textAlign: 'right', lineHeight: 48, marginBottom: SPACE.md },
  quranTrans: { fontSize: 17, fontStyle: 'italic', lineHeight: 26, textAlign: 'center', opacity: 0.9 },
  quranBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    marginTop: SPACE.lg, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  quranRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // ── Reflection / Insight ──
  quoteBox: { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1 },
  openQuote:  { fontSize: 62, lineHeight: 46, fontWeight: '900' },
  closeQuote: { fontSize: 62, lineHeight: 54, fontWeight: '900', textAlign: 'right' },
  quoteBody: {
    fontFamily: FONTS.regular, fontSize: 19, fontStyle: 'italic',
    lineHeight: 30, textAlign: 'center', fontWeight: '400',
  },
  insightBox: { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1, borderLeftWidth: 3 },

  // ── MCQ ──
  mcqBox:   { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1, marginBottom: SPACE.xl },
  mcqQ:     { fontFamily: FONTS.bold, fontSize: 19, lineHeight: 28 },
  optionsList: { gap: SPACE.md },
  mcqOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
    padding: SPACE.md, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  mcqLetter: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  mcqLetterTxt: { fontSize: 13, fontWeight: '900' },
  mcqOptTxt: { flex: 1, fontSize: 16, fontWeight: '500' },

  // ── Progress ──
  progressCards: { flexDirection: 'row', gap: SPACE.md, marginBottom: SPACE.xl },
  progressCard: {
    flex: 1, borderRadius: RADIUS.xl, padding: SPACE.lg,
    alignItems: 'center', gap: SPACE.sm, borderWidth: 1,
  },
  progressRing: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.sm,
  },
  progressCardTitle: { fontFamily: FONTS.bold, fontSize: 17 },
  progressCardSub: { fontSize: 13, textAlign: 'center' },
  revisitWrap: { borderRadius: RADIUS.lg, padding: SPACE.lg, borderWidth: 1 },
  revisitTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACE.md },
  revisitLabel: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  revisitCount: { fontFamily: FONTS.bold, fontSize: 15 },
  revisitTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  revisitFill: { height: '100%', borderRadius: 3 },
});

export default NameDetailScreen;
