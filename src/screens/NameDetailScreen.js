import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS, SPACE, RADIUS } from '../theme';

const { width: SW } = Dimensions.get('window');
const SPINE_W = 10;

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
const NameDetailScreen = ({ route, navigation }) => {
  const { name }                                            = route.params;
  const { markAsLearned, learnedIds, masteredIds, revisitCounts } = useNames();
  const { colors, isDark }                                  = useAppTheme();

  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback,   setShowFeedback]   = useState(false);
  const [currentPage,    setCurrentPage]    = useState(0);
  const [pagesLayout,    setPagesLayout]    = useState({
    width:  SW - SPACE.md * 2 - SPINE_W - 2,
    height: 560,
  });

  const scrollRef = useRef(null);

  const isLearned    = learnedIds.includes(name.number);
  const isMastered   = masteredIds.includes(name.number);
  const revisitCount = revisitCounts?.[name.number] ?? revisitCounts?.[String(name.number)] ?? 0;

  const benefits        = parseBenefits(name);
  const quranicRefs     = parseQuranicRefs(name);
  const reflection      = getField(name, 'reflection', 'learning_insight', 'learningInsight', 'description');
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
    if (benefits.length > 0)                                                            s.push({ id: 'benefits' });
    if (quranicRefs.filter(r => r.arabic || r.translation).length > 0)                 s.push({ id: 'quran' });
    if (reflection)                                                                     s.push({ id: 'reflection' });
    if (learningInsight && learningInsight !== reflection)                              s.push({ id: 'insight' });
    if (name.learningCards && Array.isArray(name.learningCards)) {
      name.learningCards.forEach(card => s.push({ id: `dynamic_${card.id}`, type: 'dynamic', data: card }));
    }
    s.push({ id: 'mcq' });
    s.push({ id: 'progress' });
    return s;
  }, [benefits, quranicRefs, reflection, learningInsight, name.learningCards]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goToPage = useCallback((idx) => {
    if (idx < 0 || idx >= slides.length) return;
    scrollRef.current?.scrollTo({ x: idx * pagesLayout.width, animated: true });
    setCurrentPage(idx);
  }, [slides.length, pagesLayout.width]);

  const handleScroll = useCallback((e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / pagesLayout.width);
    if (page >= 0 && page < slides.length) setCurrentPage(page);
  }, [pagesLayout.width, slides.length]);

  // ── Quiz ─────────────────────────────────────────────────────────────────────
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

  // ── Unified design tokens ────────────────────────────────────────────────────
  // All cards share the same warm cream palette as the Hero card
  const BG  = isDark ? ['#0b0704', '#170e04'] : ['#fffaeb', '#f5edcc'];
  const IC  = isDark ? 'rgba(201,168,76,0.09)' : 'rgba(130,100,30,0.08)';
  const ICB = isDark ? 'rgba(201,168,76,0.24)' : 'rgba(130,100,30,0.18)';
  const QBG = isDark ? 'rgba(201,168,76,0.03)' : 'rgba(201,168,76,0.06)';
  const QBC = isDark ? 'rgba(201,168,76,0.12)' : 'rgba(180,140,40,0.18)';

  // ─── PAGE 1: HERO ─────────────────────────────────────────────────────────────
  const ovalSize = pagesLayout.width * 0.80;
  const renderHeroPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />

      {/* Large sacred oval — the centrepiece halo */}
      <View style={[styles.heroOval, {
        width: ovalSize, height: ovalSize, borderRadius: ovalSize / 2,
        top: pagesLayout.height * 0.22,
        left: (pagesLayout.width - ovalSize) / 2,
        backgroundColor: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.09)',
        borderColor: isDark ? 'rgba(201,168,76,0.14)' : 'rgba(180,140,40,0.2)',
      }]} />

      {/* Corner ornaments */}
      <View style={[styles.heroCorner, styles.heroCornerTL, { borderColor: isDark ? 'rgba(201,168,76,0.18)' : 'rgba(130,100,30,0.2)' }]} />
      <View style={[styles.heroCorner, styles.heroCornerTR, { borderColor: isDark ? 'rgba(201,168,76,0.18)' : 'rgba(130,100,30,0.2)' }]} />
      <View style={[styles.heroCorner, styles.heroCornerBL, { borderColor: isDark ? 'rgba(201,168,76,0.18)' : 'rgba(130,100,30,0.2)' }]} />
      <View style={[styles.heroCorner, styles.heroCornerBR, { borderColor: isDark ? 'rgba(201,168,76,0.18)' : 'rgba(130,100,30,0.2)' }]} />

      <ScrollView contentContainerStyle={styles.heroPage} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <Text style={[styles.pageLabel, { color: isDark ? 'rgba(201,168,76,0.28)' : 'rgba(130,100,30,0.35)' }]}>
          THE BEAUTIFUL NAMES
        </Text>

        {/* Number badge */}
        <View style={[styles.heroBadge, { borderColor: isDark ? 'rgba(201,168,76,0.22)' : 'rgba(180,140,40,0.28)' }]}>
          <Text style={[styles.heroNumeral, { color: isDark ? 'rgba(201,168,76,0.55)' : 'rgba(130,100,30,0.5)' }]}>
            {String(name.number).padStart(2, '0')}
          </Text>
        </View>

        {/* Arabic — lives inside the oval visually */}
        <Text style={[styles.heroArabic, { color: colors.primary }]}>{name.arabic}</Text>

        {/* Ornamental divider */}
        <View style={styles.ornamentRow}>
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
          <Ionicons name="diamond" size={7} color={colors.primary} style={{ opacity: 0.45 }} />
          <Ionicons name="diamond" size={5} color={colors.primary} style={{ opacity: 0.25, marginHorizontal: -2 }} />
          <Ionicons name="diamond" size={7} color={colors.primary} style={{ opacity: 0.45 }} />
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
        </View>

        <Text style={[styles.heroTrans, { color: colors.text }]}>{name.transliteration}</Text>
        <Text style={[styles.heroMeaning, { color: colors.textMuted }]}>{name.meaning}</Text>

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

  // ─── PAGE 2: BENEFITS ─────────────────────────────────────────────────────────
  const renderBenefitsPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="leaf-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Gifts of This Name</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            What learning {name.transliteration} brings to your life
          </Text>
        </View>
        <View style={styles.benefitsList}>
          {benefits.map((benefit, idx) => (
            <View key={idx} style={[styles.benefitCard, {
              backgroundColor: QBG,
              borderColor:     QBC,
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

  // ─── PAGE 3: QUR'AN ───────────────────────────────────────────────────────────
  const renderQuranPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="journal-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Divine Words</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Qur'anic references to this name
          </Text>
        </View>
        {quranicRefs.map((ref, idx) => (
          <View key={idx} style={[styles.quranBlock, { backgroundColor: QBG, borderColor: QBC },
            idx > 0 && { marginTop: SPACE.xl }]}>
            <Text style={[styles.bigQuote, { color: isDark ? 'rgba(201,168,76,0.1)' : 'rgba(130,100,30,0.1)' }]}>"</Text>
            {!!ref.arabic && (
              <Text style={[styles.quranArabic, { color: colors.primary }]}>{ref.arabic}</Text>
            )}
            {!!ref.translation && (
              <Text style={[styles.quranTrans, { color: colors.text }]}>"{ref.translation}"</Text>
            )}
            {!!ref.reference && (
              <View style={[styles.quranBadge, { backgroundColor: QBG, borderColor: QBC }]}>
                <Ionicons name="location-outline" size={11} color={colors.primary} />
                <Text style={[styles.quranRef, { color: colors.primary }]}>{ref.reference}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ─── PAGE 4: REFLECTION ───────────────────────────────────────────────────────
  const renderReflectionPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.sectionPage, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="water-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Ponder & Reflect</Text>
        </View>
        <View style={[styles.quoteBox, { backgroundColor: QBG, borderColor: QBC }]}>
          <Text style={[styles.openQuote,  { color: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,30,0.12)' }]}>"</Text>
          <Text style={[styles.quoteBody,  { color: colors.text }]}>{reflection}</Text>
          <Text style={[styles.closeQuote, { color: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,30,0.12)' }]}>"</Text>
        </View>
      </ScrollView>
    </View>
  );

  // ─── PAGE 5: INSIGHT ──────────────────────────────────────────────────────────
  const renderInsightPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.sectionPage, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="bulb-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Learning Insight</Text>
        </View>
        <View style={[styles.insightBox, { backgroundColor: QBG, borderColor: QBC, borderLeftColor: colors.primary }]}>
          <Text style={[styles.quoteBody, { color: colors.text }]}>{learningInsight}</Text>
        </View>
      </ScrollView>
    </View>
  );

  // ─── PAGE 6: MCQ ──────────────────────────────────────────────────────────────
  const renderMcqPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="layers-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Match the Quality</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Test your understanding of{' '}
            <Text style={{ color: colors.text, fontStyle: 'normal', fontWeight: '700' }}>{name.transliteration}</Text>
          </Text>
        </View>
        <View style={[styles.mcqBox, { backgroundColor: QBG, borderColor: QBC }]}>
          <Text style={[styles.mcqQ, { color: colors.text }]}>{mcq.q}</Text>
        </View>
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
                  isChosen      && { backgroundColor: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.35)' },
                  isRevealOk    && { backgroundColor: 'rgba(45,156,150,0.1)',  borderColor: 'rgba(45,156,150,0.35)' },
                  isWrongChoice && { backgroundColor: 'rgba(255,68,68,0.1)',   borderColor: 'rgba(255,68,68,0.35)'  },
                ]}
              >
                <View style={[styles.mcqLetter, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  ...(isRevealOk    && { backgroundColor: 'rgba(45,156,150,0.15)' }),
                  ...(isWrongChoice && { backgroundColor: 'rgba(255,68,68,0.15)'  }),
                }]}>
                  <Text style={[styles.mcqLetterTxt, { color: colors.textMuted },
                    isRevealOk    && { color: '#2d9c96' },
                    isWrongChoice && { color: '#ff4444' },
                  ]}>
                    {['A','B','C','D'][idx]}
                  </Text>
                </View>
                <Text style={[styles.mcqOptTxt, { color: colors.text },
                  isRevealOk    && { color: '#2d9c96', fontWeight: '700' },
                  isWrongChoice && { color: '#ff4444' },
                ]}>
                  {opt}
                </Text>
                {isRevealOk    && <Ionicons name="checkmark-circle" size={20} color="#2d9c96" />}
                {isWrongChoice && <Ionicons name="close-circle"     size={20} color="#ff4444" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ─── PAGE 7: PROGRESS ─────────────────────────────────────────────────────────
  const renderProgressPage = () => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.sectionPage} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="medal-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Your Journey</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Track your mastery of {name.transliteration}
          </Text>
        </View>
        <View style={styles.progressCards}>
          <TouchableOpacity
            onPress={handleMarkLearned}
            style={[styles.progressCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderColor: isLearned ? 'rgba(45,156,150,0.4)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'),
              ...(isLearned && { backgroundColor: 'rgba(45,156,150,0.07)' }),
            }]}
          >
            <View style={[styles.progressRing, {
              borderColor: isLearned ? '#2d9c96' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
              backgroundColor: isLearned ? 'rgba(45,156,150,0.08)' : 'transparent',
            }]}>
              <Ionicons name={isLearned ? 'checkmark-circle' : 'ellipse-outline'} size={38} color={isLearned ? '#2d9c96' : colors.textDimmed} />
            </View>
            <Text style={[styles.progressCardTitle, { color: isLearned ? '#2d9c96' : colors.text }]}>Learned</Text>
            <Text style={[styles.progressCardSub, { color: colors.textMuted }]}>{isLearned ? 'Completed ✓' : 'Tap to mark'}</Text>
          </TouchableOpacity>

          <View style={[styles.progressCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderColor: isMastered ? 'rgba(201,168,76,0.4)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'),
            ...(isMastered && { backgroundColor: 'rgba(201,168,76,0.07)' }),
          }]}>
            <View style={[styles.progressRing, {
              borderColor: isMastered ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
              backgroundColor: isMastered ? 'rgba(201,168,76,0.08)' : 'transparent',
            }]}>
              <Ionicons name={isMastered ? 'ribbon' : 'ribbon-outline'} size={38} color={isMastered ? colors.primary : colors.textDimmed} />
            </View>
            <Text style={[styles.progressCardTitle, { color: isMastered ? colors.primary : colors.text }]}>Mastered</Text>
            <Text style={[styles.progressCardSub, { color: colors.textMuted }]}>{revisitCount} / 3 revisits</Text>
          </View>
        </View>

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

  // ─── PAGE 8: DYNAMIC CARD ─────────────────────────────────────────────────────
  const renderDynamicCardPage = (card) => (
    <View style={{ width: pagesLayout.width, height: pagesLayout.height }}>
      <LinearGradient colors={BG} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.sectionPage, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconCircle, { backgroundColor: IC, borderWidth: 1, borderColor: ICB }]}>
            <Ionicons name="diamond-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{card.title}</Text>
        </View>
        <View style={styles.ornamentRow}>
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
          <Ionicons name="diamond" size={6} color={colors.primary} style={{ opacity: 0.45 }} />
          <View style={[styles.ornamentLine, { backgroundColor: colors.primary, opacity: 0.22 }]} />
        </View>
        <Text style={[styles.heroArabic, { color: colors.primary, fontSize: 58, lineHeight: 74, textAlign: 'center', marginVertical: SPACE.lg }]}>
          {name.arabic}
        </Text>
        <View style={[styles.quoteBox, { backgroundColor: QBG, borderColor: QBC }]}>
          <Text style={[styles.quoteBody, { color: colors.text }]}>{card.content}</Text>
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
          <View style={[styles.bookShadow, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.1)' }]} />
          <View style={[styles.bookBody, { borderColor: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.2)' }]}>

            {/* Spine */}
            <LinearGradient
              colors={['rgba(201,168,76,0.6)', 'rgba(140,100,30,0.9)', 'rgba(201,168,76,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.spine}
            />

            {/* Horizontal swipe pages */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onLayout={e => setPagesLayout({
                width:  e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })}
              style={{ flex: 1 }}
            >
              {slides.map(slide => {
                const el = renderPage(slide);
                return el ? React.cloneElement(el, { key: slide.id }) : null;
              })}
            </ScrollView>
          </View>
        </View>

        {/* ── Dots only footer (no left/right buttons) ── */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {slides.map((s, idx) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => goToPage(idx)}
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
  bookShadow:  { position: 'absolute', bottom: -7, left: 12, right: -5, top: 7, borderRadius: RADIUS.xl },
  bookBody:    { flex: 1, flexDirection: 'row', borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1 },
  spine:       { width: SPINE_W },

  // Footer – dots only
  footer:   { paddingHorizontal: SPACE.md, paddingVertical: 6, alignItems: 'center' },
  dotsRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot:      { height: 6, borderRadius: 3 },
  pageCounter: { textAlign: 'center', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: SPACE.sm },

  // ── Hero page ──
  heroOval: {
    position: 'absolute',
    borderWidth: 1,
  },
  heroCorner: {
    position: 'absolute', width: 28, height: 28, borderWidth: 1.5,
  },
  heroCornerTL: { top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  heroCornerTR: { top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  heroCornerBL: { bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  heroCornerBR: { bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  heroPage:    { alignItems: 'center', paddingVertical: SPACE.xxl, paddingHorizontal: SPACE.xl },
  pageLabel:   { fontSize: 9, fontWeight: '900', letterSpacing: 3.5, marginBottom: SPACE.xl },
  heroBadge:   { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 18, paddingVertical: 7, marginBottom: SPACE.xl },
  heroNumeral: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 4 },
  heroArabic:  { fontFamily: FONTS.arabic, fontSize: 90, textAlign: 'center', lineHeight: 115 },
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACE.lg },
  ornamentLine: { flex: 1, height: 1 },
  heroTrans:   { fontFamily: FONTS.bold, fontSize: 34, textAlign: 'center' },
  heroMeaning: {
    fontFamily: FONTS.regular, fontSize: 20, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 30, marginTop: SPACE.sm, paddingHorizontal: SPACE.sm,
  },
  categoryChip: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 5, marginTop: SPACE.xl },
  categoryText:  { fontSize: 9, fontWeight: '900', letterSpacing: 2.2 },

  // ── Generic section layout ──
  sectionPage:    { padding: SPACE.xl, paddingBottom: SPACE.xxl },
  pageHeader:     { alignItems: 'center', marginBottom: SPACE.xxl },
  pageIconCircle: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center', marginBottom: SPACE.md },
  pageTitle:      { fontFamily: FONTS.bold, fontSize: 26, textAlign: 'center', marginBottom: SPACE.xs },
  pageSubtitle:   { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.8 },

  // ── Benefits ──
  benefitsList: { gap: SPACE.md },
  benefitCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md,
    padding: SPACE.md, borderRadius: RADIUS.lg, borderWidth: 1, borderLeftWidth: 3,
  },
  benefitIdx:  { fontFamily: FONTS.bold, fontSize: 14, fontWeight: '900', minWidth: 24, marginTop: 2 },
  benefitText: { flex: 1, fontSize: 16, lineHeight: 24, fontWeight: '500' },

  // ── Qur'an ──
  quranBlock:  { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1 },
  bigQuote:    { fontSize: 70, lineHeight: 54, fontWeight: '900', marginBottom: SPACE.sm },
  quranArabic: { fontFamily: FONTS.arabic, fontSize: 28, textAlign: 'right', lineHeight: 48, marginBottom: SPACE.md },
  quranTrans:  { fontSize: 17, fontStyle: 'italic', lineHeight: 26, textAlign: 'center', opacity: 0.9 },
  quranBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    marginTop: SPACE.lg, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  quranRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // ── Reflection / Insight ──
  quoteBox:   { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1 },
  openQuote:  { fontSize: 62, lineHeight: 46, fontWeight: '900' },
  closeQuote: { fontSize: 62, lineHeight: 54, fontWeight: '900', textAlign: 'right' },
  quoteBody: {
    fontFamily: FONTS.regular, fontSize: 19, fontStyle: 'italic',
    lineHeight: 30, textAlign: 'center', fontWeight: '400',
  },
  insightBox: { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1, borderLeftWidth: 3 },

  // ── MCQ ──
  mcqBox:      { borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1, marginBottom: SPACE.xl },
  mcqQ:        { fontFamily: FONTS.bold, fontSize: 19, lineHeight: 28 },
  optionsList: { gap: SPACE.md },
  mcqOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
    padding: SPACE.md, borderRadius: RADIUS.lg, borderWidth: 1,
  },
  mcqLetter:    { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  mcqLetterTxt: { fontSize: 13, fontWeight: '900' },
  mcqOptTxt:    { flex: 1, fontSize: 16, fontWeight: '500' },

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
  progressCardSub:   { fontSize: 13, textAlign: 'center' },
  revisitWrap:  { borderRadius: RADIUS.lg, padding: SPACE.lg, borderWidth: 1 },
  revisitTop:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACE.md },
  revisitLabel: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  revisitCount: { fontFamily: FONTS.bold, fontSize: 15 },
  revisitTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  revisitFill:  { height: '100%', borderRadius: 3 },
});

export default NameDetailScreen;
