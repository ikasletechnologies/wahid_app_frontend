import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';
const JourneyScreen = () => {
  const { names, learnedIds, masteredIds, streak } = useNames();

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
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Journey</Text>
            <Text style={styles.subtitle}>Track your spiritual growth</Text>
          </View>
        </View>

        {/* Total Progress Ring Area */}
        <View style={styles.progressSection}>
          <View style={styles.ringContainer}>
            <View style={styles.ringBase} />
            <Text style={styles.ringPercent}>{Math.round(stats.progress)}%</Text>
            <Text style={styles.ringLabel}>OVERALL</Text>
          </View>
          
          <View style={styles.statsInfo}>
            <View style={[styles.statRow, { marginBottom: SPACE.md }]}>
              <View style={[styles.statDot, { backgroundColor: '#2d9c96' }]} />
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{stats.learned}</Text>
                <Text style={styles.statLab}>LEARNED</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: '#c9a84c' }]} />
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{stats.mastered}</Text>
                <Text style={styles.statLab}>MASTERED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Streak Box */}
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.15)', 'rgba(0, 0, 0, 0.2)']}
          style={styles.streakBox}
        >
          <View style={styles.streakIconWrap}>
            <Ionicons name="flame" size={32} color="#c9a84c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakVal}>{streak} Day Streak</Text>
            <Text style={styles.streakSub}>Keep learning every day!</Text>
          </View>
          <View style={styles.streakBest}>
            <Text style={styles.bestNum}>{streak}</Text>
            <Text style={styles.bestLabel}>BEST</Text>
          </View>
        </LinearGradient>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>CATEGORY PROGRESS</Text>
        <View style={styles.catStatsContainer}>
          {stats.catStats.map((cat) => (
            <View key={cat.id} style={styles.catRow}>
              <View style={styles.catHeader}>
                <View style={styles.catNameWrap}>
                  <Ionicons name={cat.icon} size={14} color={cat.color} />
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <Text style={styles.catCount}>{cat.count}/{cat.total}</Text>
              </View>
              <View style={styles.barBg}>
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
        <Text style={[styles.sectionTitle, { marginTop: SPACE.lg }]}>MILESTONES</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.milestoneScroll}
        >
          {milestones.map((m) => {
            const isUnlocked = m.type === 'streak' ? streak >= m.threshold : stats.learned >= m.threshold;
            return (
              <View key={m.id} style={[styles.milestoneCard, !isUnlocked && styles.milestoneLocked]}>
                <View style={styles.milestoneIconWrap}>
                  <Ionicons 
                    name={isUnlocked ? m.icon : 'lock-closed'} 
                    size={24} 
                    color={isUnlocked ? '#c9a84c' : COLORS.muted} 
                  />
                </View>
                <Text style={[styles.milestoneTitle, !isUnlocked && { color: COLORS.muted }]}>{m.title}</Text>
                <Text style={styles.milestoneDesc}>{m.desc}</Text>
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
    backgroundColor: COLORS.dark.black,
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
