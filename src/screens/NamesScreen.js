import React, { useState, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - SPACE.md * 3) / COLUMN_COUNT;

const NamesScreen = ({ navigation, route }) => {
  const { names, learnedIds, masteredIds, loading } = useNames();
  const { colors, isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
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

      const matchesCategory = selectedCategory
        ? (name.category === selectedCategory)
        : true;

      return matchesSearch && matchesCategory;
    });
  }, [names, searchQuery, selectedCategory]);

  const renderNameCard = ({ item }) => {
    const isLearned = learnedIds.includes(item.number);
    const isMastered = masteredIds.includes(item.number);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}
        onPress={() => navigation.navigate('NameDetail', { name: item })}
      >
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
      </TouchableOpacity>
    );
  };

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
                !selectedCategory && [styles.filterChipActive, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.1)', borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)' }]
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
                  selectedCategory === cat.id && [styles.filterChipActive, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.1)', borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)' }]
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

  listContent: {
    padding: SPACE.md,
    paddingBottom: 100,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    marginBottom: SPACE.md,
    marginRight: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
