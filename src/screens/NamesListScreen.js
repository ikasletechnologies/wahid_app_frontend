import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar, Animated, Dimensions, Easing, Modal, Alert } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SH } = Dimensions.get('window');

const SCREEN_CONFIGS = {
  favorites: {
    title: 'Favorite Names',
    subtitle: 'Your saved names for quick access.',
    placeholder: 'Search your favorites...',
    emptyIcon: 'heart-outline',
  },
  drafts: {
    title: 'Draft Names',
    subtitle: "Names you're currently studying.",
    placeholder: 'Search your drafts...',
    emptyIcon: 'document-text-outline',
  },
  learned: {
    title: 'Revision',
    subtitle: 'Names bookmarked for review.',
    placeholder: 'Search revision names...',
    emptyIcon: 'bookmark-outline',
  },
  mastered: {
    title: 'Mastered Names',
    subtitle: "Names you've fully learned.",
    placeholder: 'Search mastered names...',
    emptyIcon: 'trophy-outline',
  },
  remaining: {
    title: 'Remaining Names',
    subtitle: 'Names yet to be learned.',
    placeholder: 'Search remaining names...',
    emptyIcon: 'ellipse-outline',
  },
};

// Per-screen theme colours
const THEME_COLORS = {
  favorites: {
    accent: '#F43F5E',
    gradientDark: ['rgba(244, 63, 94, 0.08)', 'transparent'],
    gradientLight: ['#FFE4E6', 'transparent'],
    chipBgDark: '#1E293B',
    chipBgLight: '#FFE4E6',
  },
  drafts: {
    accent: '#8B5CF6',
    gradientDark: ['rgba(139, 92, 246, 0.08)', 'transparent'],
    gradientLight: ['#EDE9FE', 'transparent'],
    chipBgDark: '#1E293B',
    chipBgLight: '#EDE9FE',
  },
  learned: {
    accent: '#F97316',
    gradientDark: ['rgba(249, 115, 22, 0.08)', 'transparent'],
    gradientLight: ['#FFF7ED', 'transparent'],
    chipBgDark: '#1E293B',
    chipBgLight: '#FFEDD5',
  },
  mastered: {
    accent: '#F59E0B',
    gradientDark: ['rgba(245, 158, 11, 0.08)', 'transparent'],
    gradientLight: ['#FEF3C7', 'transparent'],
    chipBgDark: '#1E293B',
    chipBgLight: '#FEF3C7',
  },
  remaining: {
    accent: '#64748B',
    gradientDark: ['rgba(100, 116, 139, 0.08)', 'transparent'],
    gradientLight: ['#F1F5F9', 'transparent'],
    chipBgDark: '#1E293B',
    chipBgLight: '#F1F5F9',
  },
};

const NamesListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { names, learnedIds, masteredIds, draftIds, reviewLaterIds } = useNames();
  const { favouriteIds } = usePlaylist();
  const { isDark, colors } = useAppTheme();

  const statusFilter = route.params?.statusFilter || 'all';
  const config = SCREEN_CONFIGS[statusFilter] ?? {
    title: 'Names',
    subtitle: '',
    placeholder: 'Search names...',
    emptyIcon: 'list-outline',
  };

  // Resolve the theme for this screen
  const theme = THEME_COLORS[statusFilter] ?? THEME_COLORS.learned;
  const accent = theme.accent;
  const gradientColors = isDark ? theme.gradientDark : theme.gradientLight;
  const chipBg = isDark ? theme.chipBgDark : theme.chipBgLight;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);

  const exitAnim = useRef(new Animated.Value(0)).current;

  const handleClose = useCallback(() => {
    Animated.timing(exitAnim, {
      toValue: SH,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.poly(4)),
    }).start(() => navigation.goBack());
  }, [exitAnim, navigation]);

  // Base list: filtered by screen type only
  const baseList = useMemo(() => {
    let result = names ?? [];
    if (statusFilter === 'learned') {
      result = result.filter(n => reviewLaterIds && reviewLaterIds.includes(n.number));
    } else if (statusFilter === 'mastered') {
      result = result.filter(n => masteredIds.includes(n.number));
    } else if (statusFilter === 'remaining') {
      result = result.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    } else if (statusFilter === 'favorites') {
      result = result.filter(n => favouriteIds && favouriteIds.has(n.number ?? n.id));
    } else if (statusFilter === 'drafts') {
      result = result.filter(n => draftIds && draftIds.includes(n.number ?? n.id));
    }
    return result;
  }, [names, learnedIds, masteredIds, draftIds, favouriteIds, statusFilter, reviewLaterIds]);

  // Categories that actually appear in this list
  const availableCategories = useMemo(() => {
    const cats = [...new Set(baseList.map(n => n.category).filter(Boolean))];
    return ['All', ...cats.map(c => c.charAt(0).toUpperCase() + c.slice(1))];
  }, [baseList]);

  // Final display list: category + search
  const listData = useMemo(() => {
    let result = baseList;
    if (selectedCategory !== 'All') {
      result = result.filter(n => n.category === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(n =>
        (n.transliteration && n.transliteration.toLowerCase().includes(q)) ||
        (n.meaning && n.meaning.toLowerCase().includes(q)) ||
        (n.arabic && n.arabic.includes(searchQuery.trim()))
      );
    }
    return result;
  }, [baseList, selectedCategory, searchQuery]);

  const renderItem = useCallback(({ item }) => {
    const isMastered = masteredIds.includes(item.number);
    const isLearned  = learnedIds.includes(item.number) && !isMastered;

    let statusDot = null;
    if (isMastered) statusDot = '#FFC107';
    else if (isLearned) statusDot = '#4CAF50';

    let cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
    let cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF';

    if (isMastered) {
      cardBg = isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB';
      cardBorder = isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7';
    } else if (isLearned) {
      cardBg = isDark ? 'rgba(76, 175, 80, 0.05)' : '#F8FAF9';
      cardBorder = isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9';
    }

    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: cardBg, borderColor: cardBorder }]}
        activeOpacity={0.7}
        onPress={async () => {
          const isDraftLimitReached = draftIds && draftIds.length >= 5;
          const isNew = !learnedIds.includes(item.number) && !masteredIds.includes(item.number) && (!draftIds || !draftIds.includes(item.number));

          if (isDraftLimitReached && isNew) {
            Alert.alert(
              "Draft Limit Reached",
              "You have 5 pending drafts. Please complete them before starting a new name.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Study Drafts", onPress: () => navigation.navigate('NamesList', { statusFilter: 'drafts' }) }
              ]
            );
            return;
          }

          let extraParams = { initialStepIndex: 0 };
          if (statusFilter === 'drafts' || statusFilter === 'learned') {
            try {
              const saved = await AsyncStorage.getItem(`draft_progress_${item.number ?? item.id}`);
              if (saved) {
                extraParams.draftProgress = JSON.parse(saved);
                extraParams.initialStepIndex = extraParams.draftProgress.stepIndex || 0;
              }
            } catch (e) {}
          }
          navigation.navigate('NameDetail', {
            name: { ...item, id: item.id ?? item.number },
            ...extraParams,
          });
        }}
      >
        {/* Number bubble */}
        <View style={[styles.numBubble, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
          <Text style={[styles.numText, { color: accent }]}>
            {String(item.number).padStart(2, '0')}
          </Text>
          {statusDot && (
            <View style={[styles.statusDot, { backgroundColor: statusDot, borderColor: isDark ? '#0F172A' : '#FFFFFF' }]} />
          )}
        </View>

        {/* Transliteration + meaning */}
        <View style={styles.textCol}>
          <Text style={[styles.transText, { color: colors.text }]}>{item.transliteration}</Text>
          {statusFilter !== 'drafts' && (
            <Text style={[styles.meaningText, { color: isDark ? '#64748B' : '#94A3B8' }]}>{item.meaning}</Text>
          )}
        </View>

        {/* Arabic */}
        {statusFilter !== 'drafts' && (
          <Text style={[styles.arabicText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
            {item.arabic}
          </Text>
        )}

        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? '#334155' : '#CBD5E1'}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>
    );
  }, [isDark, colors, masteredIds, learnedIds, navigation, accent, statusFilter]);

  const hasActiveFilter = selectedCategory !== 'All';

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: exitAnim }] }]}>
      <SafeAreaView
        style={[styles.root, { backgroundColor: isDark ? '#0F172A' : '#F8FAFF' }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* ── PREMIUM THEMED GRADIENT HEADER ── */}
        <LinearGradient
          colors={gradientColors}
          style={styles.headerBg}
        />

        {/* ── HEADER ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{config.title}</Text>
          </View>

          {/* 3-dot filter button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              hasActiveFilter && { backgroundColor: accent, borderRadius: 18 },
            ]}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={hasActiveFilter ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
            />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: accent, opacity: 0.85 }]}>
          {config.subtitle}
        </Text>

        {/* Active category chip */}
        {hasActiveFilter && (
          <View style={styles.activeChipRow}>
            <View style={[styles.activeChip, { backgroundColor: chipBg }]}>
              <Ionicons name="pricetag-outline" size={12} color={accent} style={{ marginRight: 4 }} />
              <Text style={[styles.activeChipText, { color: accent }]}>{selectedCategory}</Text>
              <TouchableOpacity
                onPress={() => setSelectedCategory('All')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="close-circle" size={15} color={accent} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── SEARCH BAR ── */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              borderColor: isDark ? `${accent}40` : `${accent}30`,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={accent} style={{ opacity: 0.8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={config.placeholder}
            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={accent} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results count when filtered */}
        {(hasActiveFilter || searchQuery.trim()) && (
          <Text style={[styles.resultsCount, { color: accent, opacity: 0.8 }]}>
            {listData.length} result{listData.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* ── LIST ── */}
        <FlatList
          data={listData}
          keyExtractor={item => item.number.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 16, 30) }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Ionicons name={config.emptyIcon} size={36} color={isDark ? '#334155' : '#CBD5E1'} />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#475569' : '#94A3B8' }]}>
                No names found
              </Text>
              {(searchQuery || hasActiveFilter) && (
                <TouchableOpacity
                  style={[styles.clearBtn, { backgroundColor: accent }]}
                  onPress={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                >
                  <Text style={styles.clearBtnText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* ── CATEGORY FILTER DROPDOWN ── */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View
            style={[
              styles.dropdown,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                FILTER BY CATEGORY
              </Text>
            </View>

            {availableCategories.length <= 1 ? (
              <Text style={[styles.noCatsText, { color: isDark ? '#475569' : '#94A3B8' }]}>
                No categories available
              </Text>
            ) : (
              availableCategories.map(cat => {
                const isActive = selectedCategory === cat;
                const count = cat === 'All'
                  ? baseList.length
                  : baseList.filter(n => n.category === cat.toLowerCase()).length;

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      isActive && { backgroundColor: isDark ? `${accent}20` : `${accent}15` },
                    ]}
                    onPress={() => { setSelectedCategory(cat); setMenuVisible(false); }}
                  >
                    <View style={styles.dropdownItemLeft}>
                      {isActive
                        ? <Ionicons name="checkmark-circle" size={18} color={accent} style={{ marginRight: 10 }} />
                        : <View style={[styles.dropdownDot, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                      }
                      <Text style={[styles.dropdownItemText, { color: isActive ? accent : (isDark ? '#E2E8F0' : '#1A1A1A') }]}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </Text>
                    </View>
                    <View style={[styles.dropdownCount, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
                      <Text style={[styles.dropdownCountText, { color: isDark ? '#64748B' : '#94A3B8' }]}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },

  // ── Gradient header background ──
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 0,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },

  // ── Subtitle ──
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    paddingHorizontal: 16,
    marginLeft: 42,
    marginBottom: 14,
    marginTop: 2,
    zIndex: 2,
  },

  // ── Active filter chip ──
  activeChipRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    zIndex: 2,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  activeChipText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
    paddingVertical: 0,
  },

  resultsCount: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 2,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  numBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  numText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  textCol: { flex: 1 },
  transText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  meaningText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  arabicText: {
    fontFamily: FONTS.arabic,
    fontSize: 18,
    marginLeft: 8,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  clearBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },

  // ── Category dropdown ──
  dropdown: {
    position: 'absolute',
    top: 90,
    right: 16,
    minWidth: 220,
    borderRadius: 14,
    paddingVertical: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 4,
  },
  dropdownLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  dropdownCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dropdownCountText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  noCatsText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default NamesListScreen;
