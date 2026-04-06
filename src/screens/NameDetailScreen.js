import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

// Safely get a field from the name object, trying multiple key names
const getField = (name, ...keys) => {
  for (const key of keys) {
    if (name[key] !== undefined && name[key] !== null && name[key] !== '') {
      return name[key];
    }
  }
  return null;
};

// Parse benefits into an array from either array or dot-separated string
const parseBenefits = (name) => {
  const raw = getField(name, 'benefits_of_learning', 'benefits');
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(/\.\s+/).filter(Boolean);
};

// Parse quranic references into an array of { arabic, translation, reference }
const parseQuranicRefs = (name) => {
  const raw = getField(name, 'quranic_references', 'quranicReferences');
  if (Array.isArray(raw) && raw.length > 0) return raw;
  // Fallback: single fields
  const arabic = getField(name, 'quranicAyah', 'ayah');
  const translation = getField(name, 'quranicTranslation', 'ayahTranslation');
  const reference = getField(name, 'quranicReference', 'surahReference', 'reference');
  if (arabic || translation) {
    return [{ arabic, translation, reference }];
  }
  return [];
};

const NameDetailScreen = ({ route, navigation }) => {
  const { name } = route.params;
  const { markAsLearned, learnedIds, masteredIds, revisitCounts } = useNames();
  const { colors, isDark } = useAppTheme();

  const { width } = useWindowDimensions();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLearned = learnedIds.includes(name.number);
  const isMastered = masteredIds.includes(name.number);
  const revisitCount = revisitCounts?.[name.number] ?? revisitCounts?.[String(name.number)] ?? 0;

  const benefits = parseBenefits(name);
  const quranicRefs = parseQuranicRefs(name);
  const reflection = getField(name, 'reflection', 'learning_insight', 'learningInsight', 'description');
  const learningInsight = getField(name, 'learning_insight', 'learningInsight', 'reflection', 'description');

  // Parse match_the_quality / MCQ
  const mcq = useMemo(() => {
    const raw = getField(name, 'match_the_quality', 'matchTheQuality', 'mcq');
    if (raw) {
      if (Array.isArray(raw)) return raw[0];
      return raw;
    }
    // Fallback mock MCQ
    return {
      q: `What is the primary significance of ${name.transliteration}?`,
      opts: [name.meaning, 'The Creator', 'The Judge', 'The Healer'],
      ans: 0,
    };
  }, [name]);

  const handleOptionPress = (index) => {
    if (showFeedback) return;
    setSelectedOption(index);
    const correct = index === mcq.ans;
    setShowFeedback(true);

    if (correct) {
      markAsLearned(name.number);
      Toast.show({
        type: 'success',
        text1: 'Excellent!',
        text2: 'Your progress has been updated.',
        visibilityTime: 2500,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Not quite!',
        text2: 'Keep studying and try again.',
        visibilityTime: 2500,
      });
    }
  };

  const handleMarkLearned = async () => {
    await markAsLearned(name.number);
    Toast.show({
      type: 'success',
      text1: 'Marked as Learned',
      text2: `${name.transliteration} added to your progress.`,
      visibilityTime: 2000,
    });
  };

  const slidesData = useMemo(() => {
    const data = [
      { id: 'hero' }
    ];
    if (benefits.length > 0) data.push({ id: 'benefits' });
    if (quranicRefs.map(r => r.arabic || r.translation).filter(Boolean).length > 0) data.push({ id: 'quran' });
    if (reflection) data.push({ id: 'reflection' });
    if (learningInsight && learningInsight !== reflection) data.push({ id: 'insight' });
    data.push({ id: 'mcq' });
    data.push({ id: 'progress' });
    return data;
  }, [benefits, quranicRefs, reflection, learningInsight, name]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={{ width, flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]}
        >
          {item.id === 'hero' && (
            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroNumber}>#{name.number}</Text>
              </View>
              <Text style={[styles.heroArabic, { color: colors.primary }]}>{name.arabic}</Text>
              <Text style={[styles.heroTrans, { color: colors.text }]}>{name.transliteration}</Text>
              <View style={[styles.heroDivider, { backgroundColor: colors.primary, opacity: 0.3 }]} />
              <Text style={[styles.heroMeaning, { color: colors.textMuted }]}>{name.meaning}</Text>
              
              <View style={styles.heroIconDecoration}>
                <Ionicons name="book-outline" size={120} color={colors.primary} style={{ opacity: 0.03 }} />
              </View>
            </View>
          )}

          {item.id === 'progress' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>YOUR PROGRESS</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              <View style={styles.progressRow}>
                <TouchableOpacity 
                  onPress={handleMarkLearned}
                  style={[styles.progressCard, { backgroundColor: colors.glass, borderColor: colors.border }, isLearned && styles.progressCardLearned]}
                >
                  <View style={[styles.progressIconCircle, isLearned && { backgroundColor: 'rgba(45, 156, 150, 0.1)' }]}>
                    <Ionicons
                      name={isLearned ? 'checkmark-circle' : 'ellipse-outline'}
                      size={32}
                      color={isLearned ? '#2d9c96' : colors.textDimmed}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: colors.text }, isLearned && { color: '#2d9c96' }]}>Learned</Text>
                  <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                    {isLearned ? 'Completed' : 'Tap to mark'}
                  </Text>
                </TouchableOpacity>
                
                <View style={[styles.progressCard, { backgroundColor: colors.glass, borderColor: colors.border }, isMastered && styles.progressCardMastered]}>
                  <View style={[styles.progressIconCircle, isMastered && { backgroundColor: 'rgba(201, 168, 76, 0.1)' }]}>
                    <Ionicons
                      name={isMastered ? 'ribbon' : 'ribbon-outline'}
                      size={32}
                      color={isMastered ? colors.primary : colors.textDimmed}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: colors.text }, isMastered && { color: colors.primary }]}>Mastered</Text>
                  <Text style={[styles.progressSub, { color: colors.textMuted }]}>Revisits: {revisitCount} / 3</Text>
                </View>
              </View>
            </View>
          )}

          {item.id === 'benefits' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="heart" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BENEFITS OF LEARNING</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              <View style={styles.benefitsContainer}>
                {benefits.map((benefit, idx) => (
                  <View key={idx} style={[styles.benefitItem, { backgroundColor: colors.glass, borderColor: colors.border }]}>
                    <View style={[styles.benefitIconBox, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="sparkles" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.id === 'quran' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>QUR'ANIC REFERENCES</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              {quranicRefs.map((ref, idx) => (
                <View key={idx} style={[styles.quranCard, { backgroundColor: colors.glass, borderColor: colors.border }, idx > 0 && { marginTop: SPACE.md }]}>
                  <Ionicons name="chatbubbles" size={40} color={colors.primary} style={styles.quoteIconWatermark} />
                  {ref.arabic ? (
                    <Text style={[styles.quranArabic, { color: colors.primary }]}>{ref.arabic}</Text>
                  ) : null}
                  {ref.translation ? (
                    <Text style={[styles.quranTrans, { color: colors.text }]}>“{ref.translation}”</Text>
                  ) : null}
                  {ref.reference ? (
                    <View style={styles.quranRefBadge}>
                      <Text style={[styles.quranRef, { color: colors.primary }]}>{ref.reference}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {item.id === 'reflection' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>REFLECTION</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              <View style={[styles.reflectionBox, { backgroundColor: colors.glass }]}>
                <Ionicons name="chatbubble-ellipses" size={60} color={colors.primary} style={styles.reflectionWatermark} />
                <Text style={[styles.reflectionText, { color: colors.text }]}>{reflection}</Text>
              </View>
            </View>
          )}

          {item.id === 'insight' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="school" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LEARNING INSIGHT</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              <View style={[styles.reflectionBox, { backgroundColor: colors.glass, borderLeftColor: colors.primary }]}>
                <Ionicons name="star" size={60} color={colors.primary} style={styles.reflectionWatermark} />
                <Text style={[styles.reflectionText, { color: colors.text }]}>{learningInsight}</Text>
              </View>
            </View>
          )}

          {item.id === 'mcq' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="help-circle" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MATCH THE QUALITY</Text>
                <View style={[styles.sectionLine, { backgroundColor: colors.borderStrong }]} />
              </View>
              <View style={[styles.mcqCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
                <View style={styles.mcqBadge}>
                  <Ionicons name="flash" size={14} color={colors.primary} />
                  <Text style={[styles.mcqBadgeText, { color: colors.primary }]}>Quick Knowledge Check</Text>
                </View>
                <Text style={[styles.mcqSubtitle, { color: colors.textMuted }]}>
                  Test your understanding of <Text style={{ color: colors.text, fontWeight: 'bold' }}>{name.transliteration}</Text>
                </Text>
                <Text style={[styles.mcqQuestion, { color: colors.text }]}>{mcq.q}</Text>
                <View style={styles.optionsWrap}>
                  {(mcq.opts || []).map((opt, idx) => {
                    let optStyle = [styles.option, { backgroundColor: colors.glass, borderColor: colors.border }];
                    if (showFeedback) {
                      if (idx === mcq.ans) optStyle = [styles.option, styles.optionCorrect];
                      else if (selectedOption === idx) optStyle = [styles.option, styles.optionWrong];
                    } else if (selectedOption === idx) {
                      optStyle = [styles.option, styles.optionSelected];
                    }
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={optStyle}
                        onPress={() => handleOptionPress(idx)}
                        disabled={showFeedback}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: colors.text },
                          showFeedback && idx === mcq.ans && styles.textCorrect,
                          showFeedback && selectedOption === idx && idx !== mcq.ans && styles.textWrong,
                        ]}>
                          {opt}
                        </Text>
                        {showFeedback && idx === mcq.ans && (
                          <Ionicons name="checkmark-circle" size={20} color="#2d9c96" />
                        )}
                        {showFeedback && selectedOption === idx && idx !== mcq.ans && (
                          <Ionicons name="close-circle" size={20} color="#ff4444" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={styles.bookBinder} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)'] : [colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.glass }]}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Details</Text>
          <TouchableOpacity
            onPress={handleMarkLearned}
            style={[styles.learnBadge, { backgroundColor: colors.glass, borderColor: colors.borderStrong }, isLearned && styles.learnedBadgeActive]}
          >
            <Ionicons
              name={isLearned ? 'checkmark-circle' : 'add-circle-outline'}
              size={16}
              color={isLearned ? '#2d9c96' : colors.textMuted}
            />
            <Text style={[styles.learnBadgeText, { color: colors.textMuted }, isLearned && { color: '#2d9c96' }]}>
              {isLearned ? 'LEARNED' : 'MARK'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={slidesData}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={renderSlide}
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slidesData.map((_, idx) => (
            <View key={idx} style={[styles.dot, { backgroundColor: colors.borderStrong }, currentIndex === idx && [styles.activeDot, { backgroundColor: colors.primary }]]} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    height: 70,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.base + 2,
    letterSpacing: 1.2,
  },
  learnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  learnedBadgeActive: {
    backgroundColor: 'rgba(45, 156, 150, 0.15)',
    borderColor: 'rgba(45, 156, 150, 0.4)',
  },
  learnBadgeText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: SPACE.lg,
    paddingBottom: SPACE.xxl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: SPACE.xl,
    position: 'relative',
  },
  heroBadge: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACE.md,
  },
  heroNumber: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 4,
  },
  heroArabic: {
    color: '#c9a84c',
    fontFamily: FONTS.arabic,
    fontSize: 84,
    textAlign: 'center',
    lineHeight: 110,
  },
  heroTrans: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 42,
    marginTop: SPACE.xs,
    textAlign: 'center',
  },
  heroDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginVertical: SPACE.lg,
  },
  heroMeaning: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 24,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: SPACE.md,
  },
  heroIconDecoration: {
    position: 'absolute',
    top: '20%',
    zIndex: -1,
  },

  // Section
  section: {
    marginTop: SPACE.xl,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACE.lg,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: SPACE.lg,
    alignItems: 'center',
    gap: 10,
  },
  progressIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressCardLearned: {
    backgroundColor: 'rgba(45, 156, 150, 0.08)',
    borderColor: 'rgba(45, 156, 150, 0.3)',
  },
  progressCardMastered: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  progressLabel: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  progressSub: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Benefits
  benefitsContainer: {
    gap: SPACE.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: SPACE.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },

  // Quranic references
  quranCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  quoteIconWatermark: {
    position: 'absolute',
    top: -10,
    left: -10,
    opacity: 0.1,
    transform: [{ rotate: '180deg' }],
  },
  quranArabic: {
    color: '#8b5cf6',
    fontFamily: FONTS.arabic,
    fontSize: 32,
    textAlign: 'right',
    lineHeight: 52,
    marginBottom: SPACE.md,
  },
  quranTrans: {
    color: COLORS.white,
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 28,
    opacity: 0.9,
    textAlign: 'center',
  },
  quranRefBadge: {
    alignSelf: 'center',
    marginTop: SPACE.lg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
    borderRadius: RADIUS.full,
  },
  quranRef: {
    color: '#2d9c96',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Reflection / Learning Insight
  reflectionBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: SPACE.xl,
    borderRadius: RADIUS.xl,
    minHeight: 200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reflectionWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.05,
  },
  reflectionText: {
    color: COLORS.white,
    fontSize: 22,
    fontStyle: 'italic',
    lineHeight: 34,
    opacity: 1,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Match the Quality / MCQ
  mcqCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mcqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mcqBadgeText: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  mcqSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACE.xl,
  },
  mcqQuestion: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 20,
    marginBottom: SPACE.xl,
    lineHeight: 28,
  },
  optionsWrap: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionSelected: {
    borderColor: '#c9a84c',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  optionCorrect: {
    borderColor: '#2d9c96',
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
  },
  optionWrong: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  optionText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 1,
    flex: 1,
    fontWeight: '500',
  },
  textCorrect: {
    color: '#2d9c96',
    fontWeight: 'bold',
  },
  textWrong: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACE.lg,
    paddingBottom: SPACE.xxl,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#c9a84c',
  },
  bookBinder: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});

export default NameDetailScreen;
