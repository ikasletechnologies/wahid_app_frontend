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
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { names, learnedIds, masteredIds, streak, refresh, refreshing } = useNames();

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning!';
    if (hours < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  }, []);

  const initial = useMemo(() => {
    const name = user?.name || 'Wahid';
    return name.charAt(0).toUpperCase();
  }, [user]);

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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Pinned Top Section ── */}
      <View style={styles.fixedTopContainer}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarBubble, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#cffafe' }]}>
              <Text style={[styles.avatarInitial, { color: '#06b6d4' }]}>{initial}</Text>
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[styles.welcomeText, { color: isDark ? colors.textMuted : '#475569' }]}>
                Hello {user?.name || 'Wahid'},
              </Text>
              <Text style={[styles.userName, { color: isDark ? colors.text : '#0f172a' }]}>
                {greeting}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.streakBadge} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Streak')}
            >
              <View style={[
                styles.streakContainer,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'
                }
              ]}>
                <Image
                  source={require('../../assets/home/streak.png')}
                  style={styles.streakIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.streakText}>{String(streak || 1).padStart(2, '0')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bellButton,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'
                }
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.bellIconWrapper}>
                <Ionicons name="notifications" size={21} color="#06b6d4" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Progress Card ── */}
        <View style={[
          styles.progressContainer,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
          }
        ]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={[styles.progressPercentText, { color: colors.text }]}>
              {Math.round(stats.progress)}% Completed
            </Text>
          </View>

          <View style={[
            styles.progressBarBg,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }
          ]}>
            <LinearGradient
              colors={['#06b6d4', '#22d3ee']}
              style={[styles.progressBarFill, { width: `${stats.progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          <View style={styles.metricsRow}>
            {/* Learned Metric Card */}
            <TouchableOpacity
              style={styles.metricCardWrap}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Names', { statusFilter: 'learned', filter: null })}
            >
              <ImageBackground
                source={require('../../assets/home/sml_card.png')}
                style={styles.metricCardBackground}
                imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
              >
                <View style={styles.metricCardInner}>
                  <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.learned}</Text>
                  <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Learned</Text>

                  {/* Icon Bubble */}
                  <View style={styles.iconBubble}>
                    <Image
                      source={require('../../assets/home/learn_icon.png')}
                      style={styles.metricCardIconImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Mastered Metric Card */}
            <TouchableOpacity
              style={styles.metricCardWrap}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Names', { statusFilter: 'mastered', filter: null })}
            >
              <ImageBackground
                source={require('../../assets/home/sml_card.png')}
                style={styles.metricCardBackground}
                imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
              >
                <View style={styles.metricCardInner}>
                  <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.mastered}</Text>
                  <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Mastered</Text>

                  {/* Icon Bubble */}
                  <View style={styles.iconBubble}>
                    <Image
                      source={require('../../assets/home/master_icon.png')}
                      style={styles.metricCardIconImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Remaining Metric Card */}
            <TouchableOpacity
              style={styles.metricCardWrap}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Names', { statusFilter: 'remaining', filter: null })}
            >
              <ImageBackground
                source={require('../../assets/home/sml_card.png')}
                style={styles.metricCardBackground}
                imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
              >
                <View style={styles.metricCardInner}>
                  <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.remaining}</Text>
                  <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Remaining</Text>

                  {/* Icon Bubble */}
                  <View style={styles.iconBubble}>
                    <Image
                      source={require('../../assets/home/remain_icon.png')}
                      style={styles.metricCardIconImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Categories Section Title ── */}
        <View style={styles.categoriesHeaderRow}>
          <Text style={[styles.categoriesTitle, { color: colors.text }]}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Names')} activeOpacity={0.7}>
            <Ionicons name="list" size={22} color="#06b6d4" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Categories Feed ── */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.catVerticalList}>
          {Object.values(CATEGORIES).map((cat) => {
            const cs = categoryStats[cat.id] || { total: 0, learned: 0 };
            const pct = cs.total > 0 ? Math.round((cs.learned / cs.total) * 100) : 0;
            const isCompleted = pct === 100;

            const cardBgColors = isDark
              ? (isCompleted ? ['#062f1d', '#022c22'] : ['#0f172a', '#020617'])
              : (isCompleted ? ['#f0fdf4', '#dcfce7'] : ['#ecfeff', '#cffafe']);

            const cardBorderColor = isDark
              ? (isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)')
              : (isCompleted ? '#bbf7d0' : '#cffafe');

            const progressColor = isCompleted ? '#22c55e' : '#06b6d4';

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.verticalCatCard,
                  {
                    borderColor: cardBorderColor,
                  }
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Names', { filter: cat.id, statusFilter: null })}
              >
                <LinearGradient
                  colors={cardBgColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.catCardInner}
                >
                  <View style={styles.catLeftSection}>
                    <Text style={[styles.verticalCatName, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.verticalCatSubtitle, { color: colors.textMuted }]}>{cs.total} Names</Text>

                    <View style={styles.catProgressWrapper}>
                      <View style={styles.catProgressHeaderRow}>
                        <Text style={[styles.catProgressDetails, { color: colors.textMuted }]}>
                          {cs.learned}/{cs.total} - {pct}% Completed
                        </Text>
                      </View>
                      <View style={[styles.catProgressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
                        <LinearGradient
                          colors={isCompleted ? ['#22c55e', '#4ade80'] : ['#06b6d4', '#22d3ee']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.catProgressBarFill, { width: `${pct}%` }]}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.catRightSection}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.giantPercentage, { color: progressColor, opacity: isDark ? 0.12 : 0.22 }]}
                    >
                      {pct}%
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fixedTopContainer: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.xs,
    paddingBottom: 80,
  },

  // ── Header Styles ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.lg,
    marginTop: SPACE.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInitial: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    textAlign: 'center',
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    lineHeight: 18,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.md,
    lineHeight: 22,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  streakContainer: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  streakIconImage: {
    width: 18,
    height: 22,
    marginRight: 6,
  },
  streakText: {
    color: '#06b6d4',
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bellIconWrapper: {
    position: 'relative',
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4',
    borderWidth: 1,
    borderColor: '#ffffff',
  },

  // ── Progress Card Styles ──
  progressContainer: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    marginBottom: SPACE.lg,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  progressTitle: {
    color: '#06b6d4',
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
  },
  progressPercentText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACE.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCardWrap: {
    flex: 1,
  },
  metricCardBackground: {
    width: '100%',
    height: 72,
  },
  metricCardImageStyle: {
    borderRadius: 14,
    resizeMode: 'stretch',
  },
  metricCardInner: {
    flex: 1,
    paddingVertical: SPACE.xs + 2,
    paddingHorizontal: SPACE.sm,
    justifyContent: 'space-between',
    position: 'relative',
  },
  newMetricValue: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 26,
  },
  newMetricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  iconBubble: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  metricCardIconImage: {
    width: 14,
    height: 14,
  },

  // ── Categories Header Styles ──
  categoriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
    marginTop: SPACE.xs,
    paddingHorizontal: 2,
  },
  categoriesTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.md,
  },

  // ── Categories List Styles ──
  catVerticalList: {
    gap: 10,
  },
  verticalCatCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  catCardInner: {
    padding: SPACE.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 104,
  },
  catLeftSection: {
    flex: 1,
    paddingRight: SPACE.sm,
    justifyContent: 'center',
  },
  catRightSection: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  verticalCatName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    marginBottom: 2,
  },
  verticalCatSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginBottom: 8,
  },
  catProgressWrapper: {
    width: '100%',
    marginTop: SPACE.xs,
  },
  catProgressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  catProgressBarBg: {
    width: '100%',
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  catProgressDetails: {
    fontFamily: FONTS.semibold,
    fontSize: 10,
    textAlign: 'right',
  },
  giantPercentage: {
    fontFamily: FONTS.bold,
    fontSize: 44,
    textAlign: 'right',
    lineHeight: 48,
  },
});

export default HomeScreen;
