import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { FONTS, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// scroll padding 16*2 + card padding 16*2 = 64
const CELL_W = (width - 64) / 7;

const StreakScreen = ({ navigation }) => {
  const { streak, streakDetails } = useNames();
  const currentStreak = streak || 0;

  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const todayDOW = today.getDay();

  // Build a Set of "Y-M-D" keys from the real backend activeDates
  const streakDates = useMemo(() => {
    const set = new Set();
    (streakDetails?.activeDates || []).forEach(dateStr => {
      const d = new Date(dateStr);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [streakDetails?.activeDates]);

  const isStreakDay = (y, m, d) => streakDates.has(`${y}-${m}-${d}`);

  // A helper to determine if a week row has all valid days active
  const isWeekFullyActive = useMemo(() => {
    return (week) => {
      const validDays = week.filter(d => d !== null);
      if (validDays.length === 0) return false;
      return validDays.every(d => isStreakDay(year, month, d));
    };
  }, [year, month, streakDates]);

  // Build calendar week rows for current month
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = new Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [year, month]);

  // Weekly bar — driven by real weeklyProgress from backend
  const weeklyProgress = streakDetails?.weeklyProgress || {};
  const currentWeek = DAY_LABELS.map(label => ({
    label,
    active: !!weeklyProgress[label],
  }));

  const firstActiveIdx = currentWeek.findIndex(d => d.active);
  const activeCount = currentWeek.filter(d => d.active).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Streak</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Flame + Streak Count ── */}
        <View style={styles.heroSection}>

          {/* ── Real content row ── */}
          <View style={styles.heroRow}>

            {/* Flame + its glow blur below */}
            <View style={styles.flameColumn}>
              <View style={styles.flameWrapper}>
                <Image
                  source={require('../../assets/streakCircle.png')}
                  style={styles.sparkleCircle}
                  resizeMode="contain"
                />
                <Image
                  source={require('../../assets/bigStreak.png')}
                  style={styles.bigStreakImage}
                  resizeMode="contain"
                />
              </View>
              {/* Teal glow bloom under the flame */}
              <Image
                source={require('../../assets/streakBottomBlur.png')}
                style={styles.streakBlurImg}
                resizeMode="contain"
              />

              {/* Element-wise Flame Reflection */}
              <View style={styles.flameReflectionContainer} pointerEvents="none">
                <Image
                  source={require('../../assets/bigStreak.png')}
                  style={[styles.bigStreakImage, styles.reflectFlip, { opacity: 0.12 }]}
                  resizeMode="contain"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', '#000000']}
                  style={styles.reflectionOverlay}
                />
              </View>
            </View>

            {/* Text + its glow blur below */}
            <View style={styles.streakTextCol}>
              <View style={styles.streakTextRow}>
                {/* Gradient number: white top → cyan bottom */}
                <View style={styles.gradientNumberWrap}>
                  {/* White base number */}
                  <Text style={[styles.streakCountNumber, { color: '#ffffff' }]}>
                    {String(currentStreak).padStart(2, '0')}
                  </Text>
                  {/* Cyan bottom half overlay */}
                  <View style={styles.gradientBottomHalfOverlay}>
                    <Text style={[styles.streakCountNumber, { color: '#03B7CE', position: 'absolute', bottom: 0, left: 0 }]}>
                      {String(currentStreak).padStart(2, '0')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.streakCountLabel}>days streak !</Text>
              </View>

              {/* Cyan glow bloom under the text */}
              <Image
                source={require('../../assets/textBottomBlur.png')}
                style={styles.textBlurImg}
                resizeMode="contain"
              />

              {/* Element-wise Text Reflection */}
              <View style={styles.textReflectionContainer} pointerEvents="none">
                <View style={[styles.streakTextRow, styles.reflectFlip, { opacity: 0.12 }]}>
                  <View style={styles.gradientNumberWrap}>
                    <Text style={[styles.streakCountNumber, { color: '#ffffff' }]}>
                      {String(currentStreak).padStart(2, '0')}
                    </Text>
                    <View style={styles.gradientBottomHalfOverlay}>
                      <Text style={[styles.streakCountNumber, { color: '#03B7CE', position: 'absolute', bottom: 0, left: 0 }]}>
                        {String(currentStreak).padStart(2, '0')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.streakCountLabel}>days streak !</Text>
                </View>
                <LinearGradient
                  colors={['rgba(0,0,0,0)', '#000000']}
                  style={styles.reflectionOverlay}
                />
              </View>
            </View>

          </View>

        </View>

        {/* ── Streak Calender ── */}
        <Text style={styles.sectionTitle}>Streak Calender</Text>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonthText}>{MONTH_NAMES[month]}</Text>
            <Text style={styles.calendarYearText}>{year}</Text>
          </View>

          <View style={styles.weekdayRow}>
            {DAY_LABELS.map((day, i) => (
              <Text
                key={day}
                style={[styles.weekdayText, i === todayDOW && styles.weekdayActive]}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, wi) => {
              const fullyActive = isWeekFullyActive(week);
              const row = (
                <View style={styles.weekRow}>
                  {week.map((d, di) => {
                    if (!d) return <View key={di} style={styles.emptyDay} />;
                    const active = isStreakDay(year, month, d);
                    
                    if (fullyActive) {
                      return (
                        <Text key={di} style={styles.dayTextFullyActive}>
                          {d}
                        </Text>
                      );
                    }
                    
                    if (active) {
                      return (
                        <View key={di} style={styles.dayCircleActive}>
                          <Text style={styles.dayTextActive}>{d}</Text>
                        </View>
                      );
                    }
                    
                    return (
                      <Text
                        key={di}
                        style={[
                          styles.calendarDayText,
                          d === todayDate && styles.calendarDayToday,
                        ]}
                      >
                        {d}
                      </Text>
                    );
                  })}
                </View>
              );

              return fullyActive ? (
                <LinearGradient
                  key={wi}
                  colors={['rgba(75,213,232,0.85)', 'rgba(3,183,206,0.55)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.weekPillGradientFullyActive}
                >
                  {row}
                </LinearGradient>
              ) : (
                <View key={wi} style={styles.weekPill}>{row}</View>
              );
            })}
          </View>
        </View>

        {/* ── Weekly Quick Bar ── */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyDaysHeader}>
            {DAY_LABELS.map((day, i) => (
              <Text
                key={day}
                style={[
                  styles.weeklyDayLabel,
                  i === todayDOW && styles.weeklyDayLabelActive,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.weeklyChecksRow}>
            {/* Teal gradient pill behind active days */}
            {activeCount > 0 && (
              <LinearGradient
                colors={['rgba(2,136,157,0.6)', 'rgba(75,213,232,0.25)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.activePillBg,
                  { left: firstActiveIdx * CELL_W, width: activeCount * CELL_W },
                ]}
              />
            )}

            {currentWeek.map(d => (
              <View key={d.label} style={styles.weeklyCell}>
                <View style={d.active ? styles.iconCircleActive : styles.iconCircleInactive}>
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={d.active ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
  },

  // ── Hero section ──────────────────────────────────────────────────────────
  heroSection: {
    marginTop: 16,
    marginBottom: 0,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  // Flame column: image + blur glow below it stacked vertically
  flameColumn: {
    alignItems: 'center',
  },
  flameWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleCircle: {
    width: 130,
    height: 130,
    position: 'absolute',
  },
  bigStreakImage: {
    width: 90,
    height: 100,
  },
  // Teal glow bloom that appears directly below the flame
  streakBlurImg: {
    width: 160,
    height: 50,
    marginTop: -10,
  },

  // Text column: number + label + blur glow below
  streakTextCol: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
  },
  streakTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Cyan glow bloom that appears below the streak number
  textBlurImg: {
    width: 200,
    height: 40,
    marginTop: 2,
    marginLeft: -8,
  },
  // Two-layer clip to simulate top-white → bottom-cyan gradient on the number
  gradientNumberWrap: {
    height: 68,
    position: 'relative',
  },
  gradientBottomHalfOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    overflow: 'hidden',
  },
  streakCountNumber: {
    fontFamily: FONTS.bold,
    fontSize: 64,
    lineHeight: 68,
  },
  streakCountLabel: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#4BD5E8',
    letterSpacing: 0.3,
  },

  // Applied to both flameWrapper and streakTextCol inside the reflection
  reflectFlip: {
    transform: [{ scaleY: -1 }],
  },
  flameReflectionContainer: {
    height: 40,
    width: 90,
    overflow: 'hidden',
    marginTop: -16,
    alignItems: 'center',
  },
  textReflectionContainer: {
    height: 30,
    overflow: 'hidden',
    marginTop: -14,
  },
  reflectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // ── Section title ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#e4e4e7',
    marginBottom: SPACE.sm,
    marginTop: 24,
  },

  // ── Calendar Card ──────────────────────────────────────────────────────────
  calendarCard: {
    backgroundColor: 'rgba(22,22,28,0.9)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: SPACE.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  calendarMonthText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#ffffff',
  },
  calendarYearText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#ffffff',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#71717a',
    width: CELL_W,
    textAlign: 'center',
  },
  weekdayActive: {
    color: '#03B7CE',
    fontFamily: FONTS.bold,
  },
  calendarGrid: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 2,
  },
  weekPill: {
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.025)',
    overflow: 'hidden',
  },
  weekPillGradient: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
  },
  weekPillGradientFullyActive: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(3,183,206,0.5)',
    overflow: 'hidden',
  },
  dayTextFullyActive: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#000000',
    width: CELL_W,
    textAlign: 'center',
  },
  dayCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#03B7CE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4BD5E8',
    shadowColor: '#03B7CE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  dayTextActive: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#ffffff',
  },
  calendarDayText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#3f3f46',
    width: CELL_W,
    textAlign: 'center',
  },
  calendarDayToday: {
    color: '#a1a1aa',
    fontFamily: FONTS.bold,
  },
  emptyDay: {
    width: CELL_W,
  },

  // ── Weekly Quick Bar ───────────────────────────────────────────────────────
  weeklyCard: {
    backgroundColor: 'rgba(22,22,28,0.9)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  weeklyDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weeklyDayLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#71717a',
    width: CELL_W,
    textAlign: 'center',
  },
  weeklyDayLabelActive: {
    color: '#03B7CE',
    fontFamily: FONTS.bold,
  },
  weeklyChecksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    position: 'relative',
  },
  activePillBg: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    zIndex: 0,
    borderWidth: 1,
    borderColor: 'rgba(3,183,206,0.4)',
  },
  weeklyCell: {
    width: CELL_W,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#03B7CE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4BD5E8',
    shadowColor: '#03B7CE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircleInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});

export default StreakScreen;
