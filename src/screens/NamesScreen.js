import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - SPACE.md * 3) / COLUMN_COUNT;
const CARD_HEIGHT = 168;
const FLIP_DURATION = 520;

// ─── Page-Flip Card ──────────────────────────────────────────────────────────
//
// Mimics Apple Books page-turn:
//   1. Entry  — card flips in from "face-down" with perspective + stagger
//   2. Press  — spring-lift scale
//   3. Tap    — front folds away (0 → -90°), back reveals (90° → 0°),
//               a narrow fold-shadow strip sweeps right→left like a real crease,
//               and a light-catch highlight appears at the left edge of the back face.
//
const PageFlipCard = React.memo(({ item, onPress, colors, isDark, learnedIds, masteredIds, index }) => {
  const isLearned  = learnedIds.includes(item.number);
  const isMastered = masteredIds.includes(item.number);
  const isFlipping = useRef(false);

  const entryAnim = useRef(new Animated.Value(0)).current;
  const flipAnim  = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index * 45, 700),
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Entry: "face-down → upright" flip-in ─────────────────────────────────
  const entryStyle = {
    opacity: entryAnim,
    transform: [
      { perspective: 900 },
      { rotateX: entryAnim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
      { scale:   entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
    ],
  };

  // ── Press: spring lift ────────────────────────────────────────────────────
  const pressStyle = {
    transform: [
      { scale: pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
    ],
  };

  // ── Flip — front face: folds away (0° → -90°) ────────────────────────────
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.44, 0.5], outputRange: [1, 1, 0], extrapolate: 'clamp',
  });
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1], outputRange: ['0deg', '-90deg', '-90deg'],
  });

  // ── Flip — back face: reveals (90° → 0°) ─────────────────────────────────
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.56], outputRange: [0, 0, 1], extrapolate: 'clamp',
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1], outputRange: ['90deg', '90deg', '0deg'],
  });

  // ── Fold shadow: narrow strip sweeping right → left ───────────────────────
  const foldOpacity    = flipAnim.interpolate({
    inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 1, 1, 0],
  });
  const foldTranslateX = flipAnim.interpolate({
    inputRange: [0, 1], outputRange: [CARD_WIDTH - 20, -20],
  });

  // ── Light-catch at left edge when back face appears ───────────────────────
  const edgeOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.62, 0.88, 1], outputRange: [0, 0.7, 0, 0], extrapolate: 'clamp',
  });

  const handlePressIn = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 0, friction: 4, tension: 300, useNativeDriver: true }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (isFlipping.current) return;
    isFlipping.current = true;

    Animated.timing(flipAnim, {
      toValue: 1, duration: FLIP_DURATION, useNativeDriver: true,
    }).start(() => {
      isFlipping.current = false;
      flipAnim.setValue(0);
      onPress(item);
    });
  }, [onPress, item]);

  return (
    <Animated.View style={[styles.cardContainer, entryStyle]}>
      <Animated.View style={[{ flex: 1 }, pressStyle]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={1}
          style={{ flex: 1 }}
        >
          {/* ── FRONT FACE ─────────────────────────────────────────────────── */}
          <Animated.View style={[
            styles.cardFace,
            { backgroundColor: colors.glass, borderColor: colors.border },
            { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotateY }] },
          ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.nameNumber, { color: colors.textMuted }]}>{item.number}</Text>
              <View style={styles.badgeRow}>
                {isMastered ? (
                  <View style={[styles.statusBadge, styles.masteredBadge]}>
                    <Ionicons name="trophy" size={10} color="#c9a84c" />
                  </View>
                ) : isLearned ? (
                  <View style={[styles.statusBadge, styles.learnedBadge]}>
                    <Ionicons name="checkmark" size={10} color="#2d9c96" />
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={[styles.arabicName, { color: colors.primary }]}>{item.arabic}</Text>
            <Text style={[styles.transName, { color: colors.text }]} numberOfLines={1}>{item.transliteration}</Text>
            <Text style={[styles.meaningText, { color: colors.textMuted }]} numberOfLines={2}>{item.meaning}</Text>
          </Animated.View>

          {/* ── BACK FACE ──────────────────────────────────────────────────── */}
          <Animated.View style={[
            styles.cardFace,
            { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotateY }], overflow: 'hidden' },
          ]}>
            {/* Parchment-style background */}
            <LinearGradient
              colors={isDark
                ? ['rgba(18,12,4,0.97)', 'rgba(38,26,8,0.97)']
                : ['rgba(248,240,218,0.98)', 'rgba(230,215,178,0.98)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.backContent, { borderColor: 'rgba(201,168,76,0.2)' }]}>
              <Text style={[styles.backArabic, { color: '#c9a84c' }]}>{item.arabic}</Text>
              <View style={[styles.backDivider, { backgroundColor: 'rgba(201,168,76,0.35)' }]} />
              <Text style={[styles.backNumber, { color: isDark ? 'rgba(201,168,76,0.45)' : 'rgba(150,120,40,0.55)' }]}>
                {String(item.number).padStart(2, '0')}
              </Text>
            </View>
            {/* Light-catch at left edge (simulates light grazing the newly-revealed surface) */}
            <Animated.View style={[styles.edgeHighlight, { opacity: edgeOpacity }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.35)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </Animated.View>

          {/* ── FOLD SHADOW (sweeps right → left like a real page crease) ─── */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius: RADIUS.md, overflow: 'hidden' }]}>
            <Animated.View style={[styles.foldShadow, { opacity: foldOpacity, transform: [{ translateX: foldTranslateX }] }]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.25)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>

        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ─── NamesScreen ─────────────────────────────────────────────────────────────

const NamesScreen = ({ navigation, route }) => {
  const { names, learnedIds, masteredIds, loading } = useNames();
  const { colors, isDark } = useAppTheme();
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.filter || null);

  useEffect(() => {
    if (route.params?.filter !== undefined) {
      setSelectedCategory(route.params.filter);
    }
  }, [route.params?.filter]);

  const filteredNames = useMemo(() => {
    return names.filter((name) => {
      const matchesSearch =
        (name.arabic || '').includes(searchQuery) ||
        (name.transliteration || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (name.meaning || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory ? (name.category === selectedCategory) : true;

      return matchesSearch && matchesCategory;
    });
  }, [names, searchQuery, selectedCategory]);

  const handleCardPress = useCallback((item) => {
    navigation.navigate('NameDetail', { name: item });
  }, [navigation]);

  const renderNameCard = useCallback(({ item, index }) => (
    <PageFlipCard
      item={item}
      index={index}
      onPress={handleCardPress}
      colors={colors}
      isDark={isDark}
      learnedIds={learnedIds}
      masteredIds={masteredIds}
    />
  ), [colors, isDark, learnedIds, masteredIds, handleCardPress]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.container}>

        {/* Search Header */}
        <View style={[styles.searchWrap, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name or meaning..."
            placeholderTextColor={colors.textDimmed}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip, { backgroundColor: colors.glass, borderColor: colors.border },
                !selectedCategory && [styles.filterChipActive, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.1)', borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)' }],
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterText, { color: colors.textMuted }, !selectedCategory && [styles.filterTextActive, { color: colors.primary }]]}>ALL</Text>
            </TouchableOpacity>

            {Object.values(CATEGORIES).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip, { backgroundColor: colors.glass, borderColor: colors.border },
                  selectedCategory === cat.id && [styles.filterChipActive, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.1)', borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)' }],
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.filterText, { color: colors.textMuted }, selectedCategory === cat.id && [styles.filterTextActive, { color: colors.primary }]]}>
                  {cat.id.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Names Grid */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading names...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNames}
            renderItem={renderNameCard}
            keyExtractor={(item) => item.number.toString()}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textDimmed} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {names.length === 0
                    ? 'Names are being loaded. Please check your connection.'
                    : 'No names found matching your search.'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
  },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: SPACE.md,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.full,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
  },

  // ── Filters ──
  filterContainer: {
    marginBottom: SPACE.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACE.md,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  filterTextActive: {
    color: '#c9a84c',
  },

  // ── Grid ──
  listContent: {
    padding: SPACE.md,
    paddingBottom: 100,
  },

  // ── Page-Flip Card ──
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: SPACE.md,
    marginRight: SPACE.md,
  },
  cardFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
  },
  nameNumber: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnedBadge: {
    backgroundColor: 'rgba(45, 156, 150, 0.1)',
  },
  masteredBadge: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  arabicName: {
    color: '#c9a84c',
    fontFamily: FONTS.arabic,
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 4,
  },
  transName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  meaningText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    height: 32,
  },

  // ── Back face ──
  backContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  backArabic: {
    fontFamily: FONTS.arabic,
    fontSize: 34,
    textAlign: 'center',
  },
  backDivider: {
    width: 36,
    height: 1,
    marginVertical: 8,
  },
  backNumber: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  edgeHighlight: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 8,
  },

  // ── Fold shadow strip ──
  foldShadow: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 40,
    left: 0,
  },

  // ── Empty ──
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
    marginTop: SPACE.md,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default NamesScreen;
