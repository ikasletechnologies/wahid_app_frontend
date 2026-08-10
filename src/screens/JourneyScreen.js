import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Text from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';
const JourneyScreen = () => {
  const { names, learnedIds, masteredIds, streak } = useNames();
  const { colors, isDark } = useAppTheme();

  const stats = useMemo(() => {
    const total = 99;
    const learned = learnedIds.length;
    const mastered = masteredIds.length;
    const progress = (learned / total) * 100;
    
    // Category Breakdown
    const catStats = Object.values(CATEGORIES).map(cat => {
      const catNames = names.filter(n => n.category === cat.id);
      const learnedInCat = catNames.filter(n => learnedIds.includes(n.number)).length;
      const catTotal = catNames.length || 1;
      return {
        ...cat,
        count: learnedInCat,
        total: catTotal,
        percent: (learnedInCat / catTotal) * 100,
      };
    });

    return { total, learned, mastered, progress, catStats };
  }, [names, learnedIds, masteredIds]);

  const milestones = [
    { id: 1, title: 'First Step', desc: 'Learned 1 Name', icon: 'flag', threshold: 1 },
    { id: 2, title: 'The Seeker', desc: 'Learned 10 Names', icon: 'compass', threshold: 10 },
    { id: 3, title: 'Knowledgeable', desc: 'Learned 50 Names', icon: 'book', threshold: 50 },
    { id: 4, title: 'The Master', desc: 'Learned 99 Names', icon: 'star', threshold: 99 },
    { id: 5, title: 'Consistent', desc: '7 Day Streak', icon: 'flame', threshold: 7, type: 'streak' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Journey</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track your spiritual growth</Text>
          </View>
        </View>

        {/* Total Progress Ring Area */}
        <View style={[styles.progressSection, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <View style={[styles.ringContainer, { borderColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.15)' }]}>
            <View style={[styles.ringBase, { borderTopColor: colors.primary }]} />
            <Text style={[styles.ringPercent, { color: colors.primary }]}>{Math.round(stats.progress)}%</Text>
            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>OVERALL</Text>
          </View>
          
          <View style={styles.statsInfo}>
            <View style={[styles.statRow, { marginBottom: SPACE.md }]}>
              <View style={[styles.statDot, { backgroundColor: '#2d9c96' }]} />
              <View style={styles.statTextWrap}>
                <Text style={[styles.statVal, { color: colors.text }]}>{stats.learned}</Text>
                <Text style={[styles.statLab, { color: colors.textMuted }]}>LEARNED</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
              <View style={styles.statTextWrap}>
                <Text style={[styles.statVal, { color: colors.text }]}>{stats.mastered}</Text>
                <Text style={[styles.statLab, { color: colors.textMuted }]}>MASTERED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Streak Box */}
        <LinearGradient
          colors={isDark ? ['rgba(201, 168, 76, 0.15)', 'rgba(0, 0, 0, 0.2)'] : ['rgba(184, 150, 61, 0.15)', 'rgba(255, 255, 255, 0.2)']}
          style={[styles.streakBox, { borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)' }]}
        >
          <View style={[styles.streakIconWrap, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.1)' }]}>
            <Ionicons name="flame" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakVal, { color: colors.primary }]}>{streak} Day Streak</Text>
            <Text style={[styles.streakSub, { color: colors.textMuted }]}>Keep learning every day!</Text>
          </View>
          <View style={[styles.streakBest, { borderLeftColor: colors.borderStrong }]}>
            <Text style={[styles.bestNum, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.bestLabel, { color: colors.textMuted }]}>BEST</Text>
          </View>
        </LinearGradient>

        {/* Category Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CATEGORY PROGRESS</Text>
        <View style={[styles.catStatsContainer, { backgroundColor: colors.glass }]}>
          {stats.catStats.map((cat) => (
            <View key={cat.id} style={styles.catRow}>
              <View style={styles.catHeader}>
                <View style={styles.catNameWrap}>
                  <Ionicons name={cat.icon} size={14} color={cat.color} />
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                </View>
                <Text style={[styles.catCount, { color: colors.textMuted }]}>{cat.count}/{cat.total}</Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.barFill, 
                    { width: `${cat.percent}%`, backgroundColor: cat.color }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Milestones */}
        <Text style={[styles.sectionTitle, { marginTop: SPACE.lg, color: colors.textMuted }]}>MILESTONES</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.milestoneScroll}
        >
          {milestones.map((m) => {
            const isUnlocked = m.type === 'streak' ? streak >= m.threshold : stats.learned >= m.threshold;
            return (
              <View key={m.id} style={[styles.milestoneCard, { backgroundColor: colors.glass, borderColor: colors.border }, !isUnlocked && styles.milestoneLocked]}>
                <View style={[styles.milestoneIconWrap, { backgroundColor: colors.border }]}>
                  <Ionicons 
                    name={isUnlocked ? m.icon : 'lock-closed'} 
                    size={24} 
                    color={isUnlocked ? colors.primary : colors.textDimmed} 
                  />
                </View>
                <Text style={[styles.milestoneTitle, { color: colors.primary }, !isUnlocked && { color: colors.textMuted }]}>{m.title}</Text>
                <Text style={[styles.milestoneDesc, { color: colors.textMuted }]}>{m.desc}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACE.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xl,
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
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    marginBottom: SPACE.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ringContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(201, 168, 76, 0.1)',
    position: 'relative',
  },
  ringBase: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#c9a84c',
  },
  ringPercent: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
  },
  ringLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsInfo: {
    flex: 1,
    marginLeft: SPACE.xl,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  statVal: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  statLab: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    marginBottom: SPACE.xl,
  },
  streakIconWrap: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    width: 50,
    height: 50,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACE.md,
  },
  streakVal: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  streakSub: {
    color: COLORS.muted,
    fontSize: 11,
  },
  streakBest: {
    alignItems: 'center',
    paddingLeft: SPACE.md,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  bestNum: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  bestLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
  },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: SPACE.md,
  },
  catStatsContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  catRow: {
    marginBottom: SPACE.md,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  catCount: {
    color: COLORS.muted,
    fontSize: 11,
  },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },

  milestoneScroll: {
    paddingRight: SPACE.xl,
  },
  milestoneCard: {
    width: 130,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    marginRight: SPACE.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  milestoneLocked: {
    opacity: 0.5,
  },
  milestoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  milestoneTitle: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  milestoneDesc: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default JourneyScreen;
