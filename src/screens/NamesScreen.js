/**
 * NamesScreen — "Sacred Folio" single-card full-page viewer
 *
 * One name per page. Snap-scroll vertically.
 * Adjacent cards scale down slightly (parallax depth).
 * Filters live in a bottom sheet — zero visual noise in the main view.
 * Islamic geometric corner ornaments, category aura glow, premium spacing.
 */
import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, Dimensions, Animated, Modal,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useContent } from '../context/ContentContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS, SIZES, SPACE, RADIUS } from '../theme';
import GeometricPattern from '../components/GeometricPattern';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Category accent colours ─────────────────────────────────────────────────
const CAT = {
  mercy:    { color: '#e85d5d', label: 'Mercy'    },
  majesty:  { color: '#7c3aed', label: 'Majesty'  },
  wisdom:   { color: '#0ea5e9', label: 'Wisdom'   },
  kindness: { color: '#10b981', label: 'Kindness' },
  creator:  { color: '#f59e0b', label: 'Creator'  },
  guardian: { color: '#3b82f6', label: 'Guardian' },
  forgiver: { color: '#ec4899', label: 'Forgiver' },
  exalted:  { color: '#c9a84c', label: 'Exalted'  },
};
const catColor = (key) => CAT[key]?.color ?? '#c9a84c';
const catLabel = (key) => CAT[key]?.label ?? key;
const GOLD = '#c9a84c';

// ─── Layout constants ─────────────────────────────────────────────────────────
const HEADER_H  = 64;
const CARD_PAD  = 16;        // horizontal padding each side
const CARD_GAP  = 14;        // vertical gap between cards
const CARD_W    = SW - CARD_PAD * 2;

// ─── Feed composer (Dynamic based on admin position) ────────────────────────
function composeFeed(names, contentItems) {
  // Sort items by position
  const sortedContent = [...contentItems].sort((a, b) => (a.position || 0) - (b.position || 0));
  const feed = [];
  let contentIdx = 0;

  for (let i = 0; i < names.length; i++) {
    // Insert content items if their target position matches the current feed index
    while (contentIdx < sortedContent.length && (sortedContent[contentIdx].position || 0) <= feed.length) {
      const item = sortedContent[contentIdx++];
      feed.push({ type: item.type, id: `c_${item.id}`, item: item });
    }
    feed.push({ type: 'name', id: `n_${names[i].number}`, item: names[i] });
  }

  // Push any remaining content items at the end
  while (contentIdx < sortedContent.length) {
    const item = sortedContent[contentIdx++];
    feed.push({ type: item.type, id: `c_${item.id}`, item: item });
  }

  return feed;
}

// ─── Islamic arch frame border ───────────────────────────────────────────────
// Draws the Moroccan arch frame over the cream card — top horseshoe arch,
// inner rectangle border, side concave arcs, corner/centre diamond finials.
const IslamicArchBorder = ({ cardH }) => {
  const bc   = 'rgba(139, 105, 20, 0.38)';
  const bcMd = 'rgba(139, 105, 20, 0.55)';
  const gem  = { position: 'absolute', width: 11, height: 11, borderWidth: 1.5, borderColor: bcMd, transform: [{ rotate: '45deg' }], backgroundColor: '#F0E4C8' };
  const pad  = 14;
  const archW = CARD_W * 0.68;

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {/* Inner rectangle frame */}
      <View style={{ position: 'absolute', top: pad, left: pad, right: pad, bottom: pad, borderWidth: 1, borderColor: bc, borderRadius: 10 }} />

      {/* Top horseshoe arch crown */}
      <View style={{
        position: 'absolute', top: 3,
        left: (CARD_W - archW) / 2, right: (CARD_W - archW) / 2,
        height: 52,
        borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
        borderTopLeftRadius: archW / 2, borderTopRightRadius: archW / 2,
        borderColor: bc,
      }} />

      {/* Bottom arch curve */}
      <View style={{
        position: 'absolute', bottom: 3,
        left: CARD_W * 0.22, right: CARD_W * 0.22,
        height: 36,
        borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
        borderBottomLeftRadius: CARD_W * 0.28, borderBottomRightRadius: CARD_W * 0.28,
        borderColor: bc,
      }} />

      {/* Left concave arc (bleeds off edge — only the inner curve is visible) */}
      <View style={{ position: 'absolute', left: -28, top: cardH * 0.37, width: 62, height: 84, borderRadius: 42, borderWidth: 1.5, borderColor: bc }} />
      {/* Right concave arc */}
      <View style={{ position: 'absolute', right: -28, top: cardH * 0.37, width: 62, height: 84, borderRadius: 42, borderWidth: 1.5, borderColor: bc }} />

      {/* Top-centre diamond finial */}
      <View style={[gem, { top: pad - 5.5, left: CARD_W / 2 - 5.5 }]} />
      {/* Bottom-centre diamond finial */}
      <View style={[gem, { bottom: pad - 5.5, left: CARD_W / 2 - 5.5 }]} />
      {/* Left-centre diamond finial */}
      <View style={[gem, { top: cardH / 2 - 5.5, left: pad - 5.5 }]} />
      {/* Right-centre diamond finial */}
      <View style={[gem, { top: cardH / 2 - 5.5, right: pad - 5.5 }]} />
    </View>
  );
};

// ─── Ornamental divider ───────────────────────────────────────────────────────
const OrnDiv = ({ color }) => (
  <View style={styles.ornRow} pointerEvents="none">
    <View style={[styles.ornLine, { backgroundColor: color + '40' }]} />
    <View style={styles.ornCenter}>
      <Text style={[styles.ornGem, { color: color + 'DD' }]}>✦</Text>
      <View style={[styles.ornGemRing, { borderColor: color + '25' }]} />
    </View>
    <View style={[styles.ornLine, { backgroundColor: color + '40' }]} />
  </View>
);

// ─── Name card (full page) ────────────────────────────────────────────────────
const NameCard = React.memo(({
  item, index, scrollY, cardH, onPress, isDark, learnedIds, masteredIds,
}) => {
  const cc        = catColor(item.category);
  const isLearned  = learnedIds.includes(item.number);
  const isMastered = masteredIds.includes(item.number);

  const press = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(press, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 8 }).start();
  const onOut = () => Animated.spring(press, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 8 }).start();

  return (
    <Animated.View style={[
      styles.cardWrap,
      { height: cardH, transform: [{ scale: press }] },
    ]}>
      <TouchableOpacity
        onPressIn={onIn} onPressOut={onOut}
        onPress={() => onPress(item)}
        activeOpacity={1}
        style={[styles.card, { height: cardH }]}
      >
        {/* Card background — warm Islamic parchment */}
        <LinearGradient
          colors={['#F5EDDA', '#EDE0C4', '#E6D8B8']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />

        {/* Dense Islamic geometric tile pattern */}
        <GeometricPattern color="#8B6914" isDark={false} cardW={CARD_W} cardH={cardH} />

        {/* Pattern bottom fade — preserves readability of lower text */}
        <LinearGradient
          colors={['transparent', 'rgba(230, 216, 184, 0.72)']}
          style={[StyleSheet.absoluteFillObject, { top: '50%' }]}
          pointerEvents="none"
        />

        {/* Islamic arch frame border */}
        <IslamicArchBorder cardH={cardH} />

        {/* ── Card inner content ── */}
        <View style={styles.cardInner}>

          {/* Row 1: number + category + status */}
          <View style={styles.topRow}>
            <View style={[styles.numBox, { borderColor: 'rgba(139,105,20,0.45)', backgroundColor: 'rgba(201,168,76,0.12)' }]}>
              <Text style={[styles.numText, { color: '#7A5000' }]}>
                {String(item.number).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.topRowMiddle} />

            <View style={[styles.catPill, { backgroundColor: cc + '18', borderColor: cc + '50' }]}>
              <View style={[styles.catDot, { backgroundColor: cc }]} />
              <Text style={[styles.catPillText, { color: cc }]}>{catLabel(item.category)}</Text>
            </View>

            {isMastered && (
              <View style={[styles.statusPill, { backgroundColor: GOLD + '20', borderColor: GOLD + '55' }]}>
                <Ionicons name="trophy" size={10} color="#7A5000" />
                <Text style={[styles.statusPillText, { color: '#7A5000' }]}>Mastered</Text>
              </View>
            )}
            {isLearned && !isMastered && (
              <View style={[styles.statusPill, { backgroundColor: '#2d9c9620', borderColor: '#2d9c9650' }]}>
                <Ionicons name="checkmark" size={10} color="#1A6B66" />
                <Text style={[styles.statusPillText, { color: '#1A6B66' }]}>Learned</Text>
              </View>
            )}
          </View>

          {/* Arabic — hero element */}
          <View style={styles.arabicWrap}>
            <View style={[styles.heroHalo, { backgroundColor: 'rgba(201,168,76,0.10)' }]} />
            <Text style={[styles.arabicText, { color: '#6B4000' }]}>
              {item.arabic}
            </Text>
          </View>

          {/* Ornamental divider */}
          <OrnDiv color="#8B6914" />

          {/* Transliteration */}
          <Text style={[styles.transText, { color: '#1A0F00' }]}>
            {item.transliteration}
          </Text>

          {/* Meaning */}
          <Text style={[styles.meaningText, { color: 'rgba(80, 48, 8, 0.72)' }]}
            numberOfLines={3}
          >
            {item.meaning}
          </Text>

          {/* Bottom CTA */}
          <View style={styles.ctaRow}>
            <View style={[styles.ctaLine, { backgroundColor: 'rgba(139,105,20,0.30)' }]} />
            <Text style={[styles.ctaText, { color: 'rgba(122,80,0,0.75)' }]}>Tap to explore</Text>
            <Ionicons name="arrow-forward" size={11} color="rgba(122,80,0,0.75)" style={{ marginTop: 1 }} />
            <View style={[styles.ctaLine, { backgroundColor: 'rgba(139,105,20,0.30)' }]} />
          </View>
        </View>

        {/* Bottom category colour wash */}
        <LinearGradient
          colors={['transparent', cc + '18']}
          style={styles.bottomAura}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Did You Know card (full page) ────────────────────────────────────────────
const DYKCard = React.memo(({ item, cardH }) => (
  <View style={[styles.cardWrap, { height: cardH }]}>
    <View style={[styles.card, { height: cardH, overflow: 'hidden' }]}>
      {/* Same cream parchment background */}
      <LinearGradient
        colors={['#F5EDDA', '#EDE0C4', '#E6D8B8']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <GeometricPattern color="#8B6914" isDark={false} cardW={CARD_W} cardH={cardH} />
      <LinearGradient
        colors={['transparent', 'rgba(230, 216, 184, 0.72)']}
        style={[StyleSheet.absoluteFillObject, { top: '50%' }]}
        pointerEvents="none"
      />
      <IslamicArchBorder cardH={cardH} />

      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={styles.dykIconRing}>
          <View style={[styles.dykIconBg, { backgroundColor: 'rgba(201,168,76,0.18)', borderWidth: 1, borderColor: 'rgba(139,105,20,0.30)' }]}>
            <Ionicons name="bulb-outline" size={26} color="#7A5000" />
          </View>
        </View>

        {/* Label */}
        <Text style={[styles.dykLabel, { color: '#8B6914' }]}>DID YOU KNOW?</Text>

        {/* Title */}
        {!!item.title && (
          <Text style={[styles.dykTitle, { color: '#1A0F00' }]}>
            {item.title}
          </Text>
        )}

        <OrnDiv color="#8B6914" />

        {/* Content */}
        <Text style={[styles.dykContent, { color: 'rgba(80, 48, 8, 0.72)' }]}>
          {item.content}
        </Text>
      </View>

      <LinearGradient colors={['transparent', 'rgba(139,105,20,0.12)']} style={styles.bottomAura} />
    </View>
  </View>
));

// ─── Media / Ad card (full page) ─────────────────────────────────────────────
const MediaAdCard = React.memo(({ item, cardH, isAd }) => (
  <View style={[styles.cardWrap, { height: cardH }]}>
    <View style={[styles.card, { height: cardH, overflow: 'hidden' }]}>
      {/* Same cream parchment background */}
      <LinearGradient
        colors={['#F5EDDA', '#EDE0C4', '#E6D8B8']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <GeometricPattern color="#8B6914" isDark={false} cardW={CARD_W} cardH={cardH} />
      <LinearGradient
        colors={['transparent', 'rgba(230, 216, 184, 0.72)']}
        style={[StyleSheet.absoluteFillObject, { top: '50%' }]}
        pointerEvents="none"
      />
      <IslamicArchBorder cardH={cardH} />

      {/* Sponsored label */}
      {isAd && <Text style={[styles.sponsored, { color: 'rgba(122,80,0,0.40)' }]}>Sponsored</Text>}

      <View style={styles.mediaInner}>
        {/* Tags */}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 2).map(t => (
              <View key={t} style={[styles.tag, { backgroundColor: 'rgba(139,105,20,0.14)', borderWidth: 1, borderColor: 'rgba(139,105,20,0.28)' }]}>
                <Text style={[styles.tagText, { color: '#7A5000' }]}>{t.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Title */}
        <Text style={[styles.mediaTitle, { color: '#1A0F00' }]}>{item.title}</Text>
        <OrnDiv color="#8B6914" />
        {!!item.content && (
          <Text style={[styles.mediaSub, { color: 'rgba(80, 48, 8, 0.68)' }]} numberOfLines={5}>{item.content}</Text>
        )}

        {/* CTA */}
        {!!item.ctaText && (
          <View style={styles.mediaCta}>
            <Text style={[styles.mediaCtaText, { color: '#7A5000' }]}>{item.ctaText}</Text>
            <Ionicons name="arrow-forward" size={14} color="#7A5000" />
          </View>
        )}
      </View>

      <LinearGradient colors={['transparent', 'rgba(139,105,20,0.12)']} style={styles.bottomAura} />
    </View>
  </View>
));

// ─── Filter bottom sheet ──────────────────────────────────────────────────────
const FilterSheet = React.memo(({
  visible, onClose, selectedCategory, onCategory,
  statusFilter, onStatus, colors, isDark,
}) => {
  const slideY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 400,
      friction: 9, tension: 60, useNativeDriver: true,
    }).start();
  }, [visible]);

  const STATUS = [
    { key: null,         label: 'All Names', icon: 'list-outline'            },
    { key: 'learned',   label: 'Learned',   icon: 'checkmark-circle-outline' },
    { key: 'mastered',  label: 'Mastered',  icon: 'trophy-outline'           },
    { key: 'remaining', label: 'Left',      icon: 'time-outline'             },
  ];

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.fsBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[
        styles.fsSheet,
        { backgroundColor: isDark ? '#0F1219' : '#FFFFFF', transform: [{ translateY: slideY }] },
      ]}>
        {/* Handle */}
        <View style={[styles.fsHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

        <Text style={[styles.fsTitle, { color: colors.text }]}>Filter Names</Text>

        {/* Category */}
        <Text style={[styles.fsSection, { color: colors.textMuted }]}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fsRow}>
          <TouchableOpacity
            onPress={() => onCategory(null)}
            style={[styles.fsChip, { borderColor: !selectedCategory ? GOLD + '70' : colors.border },
              !selectedCategory && { backgroundColor: GOLD + '16' }]}
          >
            <Text style={[styles.fsChipText, { color: !selectedCategory ? GOLD : colors.textMuted }]}>ALL</Text>
          </TouchableOpacity>
          {Object.values(CATEGORIES).map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onCategory(active ? null : cat.id)}
                style={[styles.fsChip, { borderColor: active ? cat.color + '70' : colors.border },
                  active && { backgroundColor: cat.color + '16' }]}
              >
                <View style={[styles.fsDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.fsChipText, { color: active ? cat.color : colors.textMuted }]}>
                  {cat.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status */}
        <Text style={[styles.fsSection, { color: colors.textMuted }]}>STATUS</Text>
        <View style={styles.fsStatusRow}>
          {STATUS.map(s => {
            const active = statusFilter === s.key;
            const col = s.key === 'learned' ? '#2d9c96' : s.key === 'mastered' ? GOLD : s.key === 'remaining' ? '#8b5cf6' : colors.textMuted;
            return (
              <TouchableOpacity
                key={String(s.key)}
                onPress={() => onStatus(s.key)}
                style={[styles.fsStatusBtn,
                  { borderColor: active ? col + '60' : colors.border },
                  active && { backgroundColor: col + '14' },
                ]}
              >
                <Ionicons name={s.icon} size={16} color={active ? col : colors.textMuted} />
                <Text style={[styles.fsStatusText, { color: active ? col : colors.textMuted }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done */}
        <TouchableOpacity style={[styles.fsDone, { backgroundColor: isDark ? GOLD : '#2D6A4F' }]} onPress={onClose}>
          <Text style={styles.fsDoneText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
});

// ─── NamesScreen ──────────────────────────────────────────────────────────────
const NamesScreen = ({ navigation, route }) => {
  const { names, learnedIds, masteredIds, loading } = useNames();
  const { contentItems } = useContent();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery,      setSearchQuery]      = useState('');
  const [searchOpen,       setSearchOpen]       = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.filter || null);
  const [statusFilter,     setStatusFilter]     = useState(route.params?.statusFilter || null);
  const [filterOpen,       setFilterOpen]       = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchH = useRef(new Animated.Value(0)).current;

  // Card height: fills remaining screen below header, above tab bar
  const TAB_BAR_H = Platform.OS === 'ios' ? 100 : 90;
  const CARD_H = SH - insets.top - HEADER_H - TAB_BAR_H - CARD_PAD;
  const ITEM_SIZE = CARD_H + CARD_GAP;

  // ── Route params ──
  useEffect(() => {
    if (route.params?.filter !== undefined) {
      setSelectedCategory(route.params.filter);
      navigation.setParams({ filter: undefined });
    }
    if (route.params?.statusFilter !== undefined) {
      setStatusFilter(route.params.statusFilter);
      navigation.setParams({ statusFilter: undefined });
    }
  }, [route.params?.filter, route.params?.statusFilter]);

  // ── Search bar animation ──
  useEffect(() => {
    Animated.timing(searchH, {
      toValue: searchOpen ? 52 : 0,
      duration: 230, useNativeDriver: false,
    }).start();
  }, [searchOpen]);

  // ── Filtered names ──
  const filteredNames = useMemo(() => names.filter(n => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      !q ||
      (n.arabic || '').includes(searchQuery) ||
      (n.transliteration || '').toLowerCase().includes(q) ||
      (n.meaning || '').toLowerCase().includes(q);
    const matchCat    = !selectedCategory || n.category === selectedCategory;
    let   matchStatus = true;
    if      (statusFilter === 'learned')   matchStatus = learnedIds.includes(n.number);
    else if (statusFilter === 'mastered')  matchStatus = masteredIds.includes(n.number);
    else if (statusFilter === 'remaining') matchStatus = !learnedIds.includes(n.number);
    return matchQ && matchCat && matchStatus;
  }), [names, searchQuery, selectedCategory, statusFilter, learnedIds, masteredIds]);

  // ── Feed ──
  const feed = useMemo(() => {
    if (searchQuery || selectedCategory || statusFilter)
      return filteredNames.map(n => ({ type: 'name', id: `n_${n.number}`, item: n }));
    return composeFeed(filteredNames, contentItems);
  }, [filteredNames, contentItems, searchQuery, selectedCategory, statusFilter]);

  // ── Active filter count (for badge) ──
  const filterCount = (selectedCategory ? 1 : 0) + (statusFilter ? 1 : 0);

  const goToDetail = useCallback((item) => {
    navigation.navigate('NameDetail', { name: item });
  }, [navigation]);

  // ── Render feed row ──
  const renderItem = useCallback(({ item: row, index }) => {
    const sharedProps = { index, scrollY, cardH: CARD_H, isDark };
    switch (row.type) {
      case 'name':
        return (
          <NameCard
            {...sharedProps}
            item={row.item}
            onPress={goToDetail}
            learnedIds={learnedIds}
            masteredIds={masteredIds}
          />
        );
      case 'did_you_know':
        return <DYKCard {...sharedProps} item={row.item} />;
      case 'media':
        return <MediaAdCard {...sharedProps} item={row.item} isAd={false} />;
      case 'advertisement':
        return <MediaAdCard {...sharedProps} item={row.item} isAd={true} />;
      default:
        return null;
    }
  }, [goToDetail, isDark, learnedIds, masteredIds, CARD_H, scrollY]);

  const getItemLayout = useCallback((_, index) => ({
    length: ITEM_SIZE, offset: ITEM_SIZE * index, index,
  }), [ITEM_SIZE]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { height: HEADER_H }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: isDark ? GOLD : '#2D6A4F' }]}>
            Al-Asmāʾ Al-Ḥusnā
          </Text>
          <View style={styles.headerSubRow}>
            <View style={[styles.headerSubDot, { backgroundColor: isDark ? GOLD : '#2D6A4F' }]} />
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {feed.length} Sacred Names
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Search toggle */}
          <TouchableOpacity
            style={[styles.hBtn, { backgroundColor: colors.glass, borderColor: colors.border }]}
            onPress={() => { setSearchOpen(v => !v); if (searchOpen) setSearchQuery(''); }}
          >
            <Ionicons name={searchOpen ? 'close' : 'search-outline'} size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Filter toggle — badge shows active count */}
          <TouchableOpacity
            style={[styles.hBtn,
              { backgroundColor: filterCount > 0 ? (isDark ? GOLD + '18' : '#2D6A4F18') : colors.glass },
              { borderColor: filterCount > 0 ? (isDark ? GOLD + '50' : '#2D6A4F50') : colors.border },
            ]}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={filterCount > 0 ? (isDark ? GOLD : '#2D6A4F') : colors.text}
            />
            {filterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: isDark ? GOLD : '#2D6A4F' }]}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Collapsible search ───────────────────────────────────────────── */}
      <Animated.View style={[styles.searchWrap, { height: searchH, overflow: 'hidden' }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.glass, borderColor: colors.border }]}>
          <Ionicons name="search" size={14} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Name, meaning, Arabic…"
            placeholderTextColor={colors.textDimmed}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={searchOpen}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ── Active filter pills (only shown when filters active) ─────────── */}
      {filterCount > 0 && (
        <View style={styles.activePillsRow}>
          {selectedCategory && (
            <TouchableOpacity
              style={[styles.activePill, { backgroundColor: catColor(selectedCategory) + '18', borderColor: catColor(selectedCategory) + '50' }]}
              onPress={() => setSelectedCategory(null)}
            >
              <View style={[styles.activePillDot, { backgroundColor: catColor(selectedCategory) }]} />
              <Text style={[styles.activePillText, { color: catColor(selectedCategory) }]}>
                {catLabel(selectedCategory)}
              </Text>
              <Ionicons name="close" size={11} color={catColor(selectedCategory)} />
            </TouchableOpacity>
          )}
          {statusFilter && (
            <TouchableOpacity
              style={[styles.activePill, { backgroundColor: colors.glass, borderColor: colors.border }]}
              onPress={() => setStatusFilter(null)}
            >
              <Text style={[styles.activePillText, { color: colors.textMuted }]}>
                {statusFilter}
              </Text>
              <Ionicons name="close" size={11} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setStatusFilter(null); }}>
            <Text style={[styles.clearAll, { color: isDark ? GOLD : '#2D6A4F' }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Feed ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={isDark ? GOLD : '#2D6A4F'} />
        </View>
      ) : (
        <Animated.FlatList
          data={feed}
          keyExtractor={row => row.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={[styles.feedContent, { paddingBottom: 120 }]}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          removeClippedSubviews
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color={colors.textDimmed} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {names.length === 0
                  ? 'Loading names…\nCheck your connection.'
                  : 'No names match your search.'}
              </Text>
            </View>
          )}
        />
      )}

      {/* ── Filter sheet ─────────────────────────────────────────────────── */}
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedCategory={selectedCategory}
        onCategory={setSelectedCategory}
        statusFilter={statusFilter}
        onStatus={setStatusFilter}
        colors={colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_PAD,
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontFamily: FONTS.arabic,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerSubDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  headerActions: { flexDirection: 'row', gap: SPACE.sm },
  hBtn: {
    width: 38, height: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4, right: -4,
    width: 16, height: 16,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: '#000' },

  // ── Search ──
  searchWrap: { paddingHorizontal: CARD_PAD, justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
  },

  // ── Active pills ──
  activePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_PAD,
    paddingBottom: 8,
    gap: 7,
    alignItems: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  activePillDot: { width: 6, height: 6, borderRadius: 3 },
  activePillText: { fontSize: 11, fontWeight: '700' },
  clearAll: { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  // ── Feed ──
  feedContent: { paddingHorizontal: CARD_PAD, paddingTop: CARD_PAD / 2 },

  // ── Card wrapper ──
  cardWrap: {
    width: CARD_W,
    marginBottom: CARD_GAP,
  },

  // ── Card base ──
  card: {
    width: CARD_W,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  auraOverlay:   { borderRadius: 24 },
  topAccent:     { height: 3, width: '100%' },
  bottomAura: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  // ── Card inner ──
  cardInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 22,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRowMiddle: { flex: 1 },
  numBox: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  numText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catDot:         { width: 5, height: 5, borderRadius: 2.5 },
  catPillText:    { fontSize: 9,  fontWeight: '800', letterSpacing: 0.8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 9, fontWeight: '700' },

  // ── Arabic hero ──
  arabicWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  arabicText: {
    fontFamily: FONTS.arabic,
    fontSize: 72,
    textAlign: 'center',
    lineHeight: 90,
    includeFontPadding: false,
  },
  heroHalo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },

  // ── Ornamental divider ──
  ornRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  ornLine: { flex: 1, height: 1 },
  ornCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  ornGem:  { fontSize: 10 },
  ornGemRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.8,
  },

  // ── Transliteration + meaning ──
  transText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // ── Bottom CTA ──
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 10,
  },
  ctaLine: { flex: 1, height: 1 },
  ctaText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // ── Did You Know ──
  dykIconRing: { alignItems: 'center', marginTop: 20, marginBottom: 12 },
  dykIconBg: {
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  dykLabel: {
    fontSize: 10, fontWeight: '800',
    letterSpacing: 2, color: GOLD,
    textAlign: 'center',
    marginBottom: 12,
  },
  dykTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 4,
  },
  dykContent: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  // ── Media / Ad ──
  mediaOrb: { position: 'absolute', borderRadius: 999 },
  mediaOrb1: { width: 220, height: 220, top: -80, right: -60 },
  mediaOrb2: { width: 160, height: 160, bottom: -50, left: -40 },
  sponsored: {
    position: 'absolute', top: 16, right: 20,
    fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: 0.5,
  },
  mediaInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  tagRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: GOLD + '20',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tagText:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: GOLD },
  mediaTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24, color: '#FFFFFF',
    lineHeight: 32, marginBottom: 4,
  },
  mediaSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    lineHeight: 22, marginBottom: 16,
  },
  mediaCta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mediaCtaText: { fontSize: 13, fontWeight: '700', color: GOLD, letterSpacing: 0.3 },

  // ── Filter sheet ──
  fsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fsSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACE.lg,
    paddingBottom: 40,
    paddingTop: SPACE.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  fsHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  fsTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACE.lg,
  },
  fsSection: {
    fontSize: 10, fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },
  fsRow:     { gap: 8, paddingBottom: SPACE.md },
  fsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  fsDot:     { width: 6, height: 6, borderRadius: 3 },
  fsChipText: { fontSize: 12, fontWeight: '700' },
  fsStatusRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: SPACE.lg,
  },
  fsStatusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: RADIUS.md, borderWidth: 1,
    minWidth: '45%',
  },
  fsStatusText: { fontSize: 13, fontWeight: '600' },
  fsDone: {
    height: 52, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginTop: SPACE.sm,
  },
  fsDoneText: {
    fontFamily: FONTS.bold, fontSize: SIZES.base,
    color: '#FFFFFF', letterSpacing: 0.3,
  },

  // ── Empty ──
  empty: {
    paddingTop: 120,
    alignItems: 'center', gap: SPACE.md,
  },
  emptyText: {
    fontSize: SIZES.sm, textAlign: 'center',
    paddingHorizontal: 40, lineHeight: 22,
  },
});

export default NamesScreen;
