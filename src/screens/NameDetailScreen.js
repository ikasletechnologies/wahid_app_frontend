import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

const NameDetailScreen = ({ route, navigation }) => {
  const { name } = route.params;
  const { markAsLearned, learnedIds, masteredIds } = useNames();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const isLearned = learnedIds.includes(name.number);
  const isMastered = masteredIds.includes(name.number);

  // Mock MCQ data if not present in backend data yet (matching prototype)
  const mcq = useMemo(() => {
    if (name.mcq) return name.mcq[0]; // Assuming array of MCQs
    return {
      q: `What is the primary significance of ${name.transliteration}?`,
      opts: [name.meaning, "The Creator", "The Judge", "The Healer"],
      ans: 0
    };
  }, [name]);

  const handleOptionPress = (index) => {
    if (showFeedback) return;
    setSelectedOption(index);
    const correct = index === mcq.ans;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      markAsLearned(name.number); // This will increment revisits in backend
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient 
        colors={['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <TouchableOpacity 
            onPress={() => markAsLearned(name.number)}
            style={[styles.learnBadge, isLearned && styles.learnedBadgeActive]}
          >
            <Ionicons 
              name={isLearned ? "checkmark-circle" : "add-circle-outline"} 
              size={16} 
              color={isLearned ? "#2d9c96" : COLORS.muted} 
            />
            <Text style={[styles.learnBadgeText, isLearned && { color: "#2d9c96" }]}>
              {isLearned ? "LEARNED" : "MARK"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Top Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroNumber}>#{name.number}</Text>
            <Text style={styles.heroArabic}>{name.arabic}</Text>
            <Text style={styles.heroTrans}>{name.transliteration}</Text>
            <Text style={styles.heroMeaning}>{name.meaning}</Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>BENEFITS & VIRTUES</Text>
              <View style={styles.sectionLine} />
            </View>
            {/* Split string benefits if it's a long text from backend */}
            {(typeof name.benefits === 'string' ? name.benefits.split('. ') : name.benefits || []).map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Reflection Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SPIRITUAL REFLECTION</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.reflectionBox}>
              <Text style={styles.reflectionText}>{name.reflection || name.description}</Text>
            </View>
          </View>

          {/* Quranic References */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>QURANIC REFERENCES</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.quranCard}>
              <Text style={styles.quranArabic}>{name.quranicAyah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}</Text>
              <Text style={styles.quranTrans}>{name.quranicTranslation || "In the name of Allah, the Most Gracious, the Most Merciful."}</Text>
              <Text style={styles.quranRef}>Surah Reference</Text>
            </View>
          </View>

          {/* MCQ Mastery Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>KNOWLEDGE CHECK</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.mcqCard}>
              <Text style={styles.mcqQuestion}>{mcq.q}</Text>
              <View style={styles.optionsWrap}>
                {mcq.opts.map((opt, idx) => {
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
                      <Text style={[styles.optionText, showFeedback && (idx === mcq.ans ? styles.textCorrect : (selectedOption === idx ? styles.textWrong : null))]}>
                        {opt}
                      </Text>
                      {showFeedback && idx === mcq.ans && (
                        <Ionicons name="checkmark-circle" size={16} color="#2d9c96" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showFeedback && (
                <View style={[styles.feedbackBox, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  <Text style={[styles.feedbackText, isCorrect ? { color: "#2d9c96" } : { color: "#ff4444" }]}>
                    {isCorrect ? "Excellent! Your progress has been updated." : "Not quite. Keep studying and try again!"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  hero: {
    alignItems: 'center',
    paddingVertical: SPACE.xl,
    position: 'relative',
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
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },

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

  quranCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quranArabic: {
    color: '#8b5cf6', // A nice calm purple for Quranic text
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
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'right',
  },

  mcqCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
  },
  textCorrect: {
    color: '#2d9c96',
    fontWeight: 'bold',
  },
  textWrong: {
    color: '#ff4444',
  },
  feedbackBox: {
    marginTop: SPACE.md,
    padding: SPACE.sm,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(45, 156, 150, 0.05)',
    borderColor: 'rgba(45, 156, 150, 0.2)',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: '700',
  }
});

export default NameDetailScreen;
