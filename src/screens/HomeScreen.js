import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { names, learnedIds, masteredIds, streak, getNameOfDay, refresh, refreshing } = useNames();

  const nameOfDay = useMemo(() => getNameOfDay(), [getNameOfDay]);

  const stats = useMemo(() => {
    const total = 99;
    const learned = learnedIds.length;
    const mastered = masteredIds.length;
    const progress = total > 0 ? (learned / total) * 100 : 0;
    return { learned, mastered, progress, remaining: total - learned };
  }, [learnedIds, masteredIds]);

  const categoryStats = useMemo(() => {
    const result = {};
    Object.keys(CATEGORIES).forEach(key => {
      result[key] = { total: 0, learned: 0 };
    });
    names.forEach(name => {
      const cat = name.category;
      if (result[cat]) {
        result[cat].total += 1;
        if (learnedIds.includes(name.number)) {
          result[cat].learned += 1;
        }
      }
    });
    return result;
  }, [names, learnedIds]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#c9a84c"
            colors={['#c9a84c']}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Assalamu Alaikum,</Text>
            <Text style={styles.userName}>{user?.name || 'Brother/Sister'}</Text>
          </View>
          <TouchableOpacity style={styles.streakBadge}>
            <LinearGradient
              colors={['#c9a84c', '#8a6d1e']}
              style={styles.streakGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="flame" size={16} color={COLORS.dark.black} />
              <Text style={styles.streakText}>{streak}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Name of the Day Card ── */}
        {nameOfDay && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NameDetail', { name: nameOfDay })}
          >
            <LinearGradient
              colors={['rgba(20, 22, 33, 1)', 'rgba(15, 17, 25, 1)']}
              style={styles.notdCard}
            >
              <View style={styles.notdLabelWrap}>
                <Text style={styles.notdLabel}>NAME OF THE DAY</Text>
              </View>

              <Text style={styles.arabicName}>{nameOfDay.arabic}</Text>
              <Text style={styles.transName}>{nameOfDay.transliteration}</Text>
              <Text style={styles.meaningText}>{nameOfDay.meaning}</Text>

              <Text style={styles.bgNumber}>{nameOfDay.number}</Text>

              <View style={styles.notdFooter}>
                <View style={styles.learnBtn}>
                  <Text style={styles.learnBtnText}>STUDY NOW</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Progress Summary ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Journey')}>
            <Text style={styles.seeAllText}>DASHBOARD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.learned}</Text>
            <Text style={styles.metricLabel}>LEARNED</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#c9a84c' }]}>{stats.mastered}</Text>
            <Text style={styles.metricLabel}>MASTERED</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: COLORS.muted }]}>{stats.remaining}</Text>
            <Text style={styles.metricLabel}>REMAINING</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressTop}>
            <Text style={styles.progressPercent}>{Math.round(stats.progress)}% COMPLETED</Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={['#2d9c96', '#c9a84c']}
              style={[styles.progressFill, { width: `${stats.progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* ── Categories 2-Column Grid ── */}
        <View style={[styles.sectionHeader, { marginTop: SPACE.sm }]}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Names')}>
            <Text style={styles.seeAllText}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.catGrid}>
          {Object.values(CATEGORIES).map((cat) => {
            const cs = categoryStats[cat.id] || { total: 0, learned: 0 };
            const pct = cs.total > 0 ? Math.round((cs.learned / cs.total) * 100) : 0;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Names', { filter: cat.id })}
              >
                <View
                  style={[
                    styles.catIconWrap,
                    {
                      backgroundColor: cat.color + '20',
                      borderColor: cat.color + '40',
                    },
                  ]}
                >
                  <Ionicons name={cat.icon} size={20} color={cat.color} />
                </View>

                <Text style={styles.catName} numberOfLines={2}>
                  {cat.name}
                </Text>

                <Text style={styles.catMeta}>
                  {cs.total > 0 ? `${cs.total} names` : '– names'} · {pct}%
                </Text>

                <View style={styles.catProgressBg}>
                  <View
                    style={[
                      styles.catProgressFill,
                      { width: `${pct}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
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
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.lg,
  },
  welcomeText: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
  },
  userName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    marginTop: 2,
  },
  streakBadge: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  streakText: {
    color: COLORS.dark.black,
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
  },

  // ── Name of the Day ──
  notdCard: {
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    marginBottom: SPACE.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  notdLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACE.md,
  },
  notdLabel: {
    color: '#c9a84c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  arabicName: {
    color: '#c9a84c',
    fontFamily: FONTS.arabic,
    fontSize: 52,
    textAlign: 'center',
    marginVertical: SPACE.xs,
  },
  transName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  meaningText: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACE.xs,
  },
  bgNumber: {
    position: 'absolute',
    right: 20,
    bottom: -5,
    fontSize: 50,
    color: 'rgba(255, 255, 255, 0.06)',
    fontFamily: FONTS.bold,
  },
  notdFooter: {
    marginTop: SPACE.lg,
    alignItems: 'center',
  },
  learnBtn: {
    backgroundColor: '#c9a84c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learnBtnText: {
    color: COLORS.dark.black,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Section Headers ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  seeAllText: {
    color: '#c9a84c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Progress Metrics ──
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: SPACE.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricValue: {
    color: '#2d9c96',
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  // ── Progress Bar ──
  progressBarContainer: {
    marginBottom: SPACE.xl,
    paddingHorizontal: 4,
  },
  progressTop: {
    marginBottom: 8,
  },
  progressPercent: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── 2-Column Category Grid ──
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: (width - SPACE.md * 2 - 10) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.sm,
    borderWidth: 1,
  },
  catName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
    marginBottom: 4,
    lineHeight: 18,
  },
  catMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: SPACE.sm,
  },
  catProgressBg: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
});

export default HomeScreen;
