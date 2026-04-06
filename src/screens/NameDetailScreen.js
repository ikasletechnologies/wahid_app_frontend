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
      { id: 'hero' },
      { id: 'progress' }
    ];
    if (benefits.length > 0) data.push({ id: 'benefits' });
    if (quranicRefs.length > 0) data.push({ id: 'quran' });
    if (reflection) data.push({ id: 'reflection' });
    if (learningInsight && learningInsight !== reflection) data.push({ id: 'insight' });
    data.push({ id: 'mcq' });
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
      <View style={{ width }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]}
        >
          {item.id === 'hero' && (
            <View style={styles.hero}>
              <Text style={styles.heroNumber}>#{name.number}</Text>
              <Text style={styles.heroArabic}>{name.arabic}</Text>
              <Text style={styles.heroTrans}>{name.transliteration}</Text>
              <Text style={styles.heroMeaning}>{name.meaning}</Text>
            </View>
          )}

          {item.id === 'progress' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.progressRow}>
                <View style={[styles.progressCard, isLearned && styles.progressCardLearned]}>
                  <Ionicons
                    name={isLearned ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={28}
                    color={isLearned ? '#2d9c96' : COLORS.dimmed}
                  />
                  <Text style={[styles.progressLabel, isLearned && { color: '#2d9c96' }]}>Learned</Text>
                  <Text style={styles.progressSub}>
                    {isLearned ? 'Completed' : 'Not yet learned'}
                  </Text>
                </View>
                <View style={[styles.progressCard, isMastered && styles.progressCardMastered]}>
                  <Ionicons
                    name={isMastered ? 'star' : 'star-outline'}
                    size={28}
                    color={isMastered ? '#c9a84c' : COLORS.dimmed}
                  />
                  <Text style={[styles.progressLabel, isMastered && { color: '#c9a84c' }]}>Mastered</Text>
                  <Text style={styles.progressSub}>Revisits: {revisitCount} / 3</Text>
                </View>
              </View>
            </View>
          )}

          {item.id === 'benefits' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>BENEFITS OF LEARNING</Text>
                <View style={styles.sectionLine} />
              </View>
              {benefits.map((benefit, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <View style={styles.benefitDot} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          {item.id === 'quran' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>QUR'ANIC REFERENCES</Text>
                <View style={styles.sectionLine} />
              </View>
              {quranicRefs.map((ref, idx) => (
                <View key={idx} style={[styles.quranCard, idx > 0 && { marginTop: SPACE.sm }]}>
                  {ref.arabic ? (
                    <Text style={styles.quranArabic}>{ref.arabic}</Text>
                  ) : null}
                  {ref.translation ? (
                    <Text style={styles.quranTrans}>"{ref.translation}"</Text>
                  ) : null}
                  {ref.reference ? (
                    <Text style={styles.quranRef}>{ref.reference}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {item.id === 'reflection' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>REFLECTION</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.reflectionBox}>
                <Text style={styles.reflectionText}>{reflection}</Text>
              </View>
            </View>
          )}

          {item.id === 'insight' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>LEARNING INSIGHT</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.reflectionBox}>
                <Text style={styles.reflectionText}>{learningInsight}</Text>
              </View>
            </View>
          )}

          {item.id === 'mcq' && (
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>MATCH THE QUALITY</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.mcqCard}>
                <View style={styles.mcqBadge}>
                  <Ionicons name="flash" size={12} color="#c9a84c" />
                  <Text style={styles.mcqBadgeText}>Quick Match</Text>
                </View>
                <Text style={styles.mcqSubtitle}>
                  Connect each quality on the <Text style={{ color: COLORS.white }}>left</Text> with how it applies on the <Text style={{ color: COLORS.white }}>right</Text>
                </Text>
                <Text style={styles.mcqQuestion}>{mcq.q}</Text>
                <View style={styles.optionsWrap}>
                  {(mcq.opts || []).map((opt, idx) => {
                    let optStyle = styles.option;
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
                          showFeedback && idx === mcq.ans && styles.textCorrect,
                          showFeedback && selectedOption === idx && idx !== mcq.ans && styles.textWrong,
                        ]}>
                          {opt}
                        </Text>
                        {showFeedback && idx === mcq.ans && (
                          <Ionicons name="checkmark-circle" size={16} color="#2d9c96" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <TouchableOpacity
            onPress={handleMarkLearned}
            style={[styles.learnBadge, isLearned && styles.learnedBadgeActive]}
          >
            <Ionicons
              name={isLearned ? 'checkmark-circle' : 'add-circle-outline'}
              size={16}
              color={isLearned ? '#2d9c96' : COLORS.muted}
            />
            <Text style={[styles.learnBadgeText, isLearned && { color: '#2d9c96' }]}>
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
            <View key={idx} style={[styles.dot, currentIndex === idx && styles.activeDot]} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dark.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    height: 60,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    letterSpacing: 1,
  },
  learnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  learnedBadgeActive: {
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
    borderColor: 'rgba(45, 156, 150, 0.3)',
  },
  learnBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: SPACE.md,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: SPACE.xl,
  },
  heroNumber: {
    color: 'rgba(201, 168, 76, 0.2)',
    fontFamily: FONTS.bold,
    fontSize: 14,
    letterSpacing: 4,
    marginBottom: SPACE.sm,
  },
  heroArabic: {
    color: '#c9a84c',
    fontFamily: FONTS.arabic,
    fontSize: 64,
    textAlign: 'center',
  },
  heroTrans: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xxl,
    marginTop: SPACE.sm,
  },
  heroMeaning: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: SIZES.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },

  // Section
  section: {
    marginTop: SPACE.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACE.md,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  progressCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: SPACE.md,
    alignItems: 'center',
    gap: 6,
  },
  progressCardLearned: {
    backgroundColor: 'rgba(45, 156, 150, 0.05)',
    borderColor: 'rgba(45, 156, 150, 0.2)',
  },
  progressCardMastered: {
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  progressLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  progressSub: {
    color: COLORS.dimmed,
    fontSize: 11,
  },

  // Benefits
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACE.sm,
  },
  benefitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c9a84c',
    marginTop: 8,
  },
  benefitText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },

  // Quranic references
  quranCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quranArabic: {
    color: '#8b5cf6',
    fontFamily: FONTS.arabic,
    fontSize: 22,
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 8,
  },
  quranTrans: {
    color: COLORS.white,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    opacity: 0.7,
  },
  quranRef: {
    color: '#2d9c96',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.5,
  },

  // Reflection / Learning Insight
  reflectionBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: '#c9a84c',
    padding: SPACE.md,
    borderRadius: RADIUS.sm,
  },
  reflectionText: {
    color: COLORS.white,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    opacity: 0.9,
  },

  // Match the Quality / MCQ
  mcqCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mcqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mcqBadgeText: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  mcqSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACE.md,
  },
  mcqQuestion: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginBottom: SPACE.md,
    lineHeight: 20,
  },
  optionsWrap: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionSelected: {
    borderColor: '#c9a84c',
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
  },
  optionCorrect: {
    borderColor: '#2d9c96',
    backgroundColor: 'rgba(45, 156, 150, 0.05)',
  },
  optionWrong: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  optionText: {
    color: COLORS.white,
    fontSize: 13,
    opacity: 0.8,
    flex: 1,
  },
  textCorrect: {
    color: '#2d9c96',
    fontWeight: 'bold',
    opacity: 1,
  },
  textWrong: {
    color: '#ff4444',
    opacity: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACE.md,
    paddingBottom: SPACE.xl,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#c9a84c',
  },
});

export default NameDetailScreen;
