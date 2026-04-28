import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, PanResponder,
  Image, ActivityIndicator, TouchableOpacity, Easing, ImageBackground,
  Modal, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

const TOP_SECTION_HEIGHT = SH * 0.35;
const CARD_W = SW - 36;
const CARD_H = 390;
const CARD_SLOT = CARD_H + 70; // vertical distance between adjacent card slots

const STACK_CONFIG = [
  { width: SW - 110, height: 100, opacity: 0.25, bottom: -30 },
  { width: SW - 160, height: 100, opacity: 0.5, bottom: -50 },
  { width: SW - 220, height: 50, opacity: 0.8, bottom: -20 },
];

// Card position formula:  translateY = (offset + scrollAnim) * CARD_SLOT
//   offset -1 = prev,  0 = current,  +1 = next
//   scrollAnim  0 = rest  |  -1 = swiped up (next enters)  |  +1 = swiped down (prev enters)

const NamesScreen = ({ navigation }) => {
  const { names, loading, learnedIds, masteredIds, categories } = useNames();
  const [activeIndex, setActiveIndex] = useState(0);

  const [filterVisible, setFilterVisible] = useState(false);
  const [tempCat, setTempCat] = useState('All');
  const [tempStatus, setTempStatus] = useState('All');
  const [tempNumber, setTempNumber] = useState('');

  const [appliedCat, setAppliedCat] = useState('All');
  const [appliedStatus, setAppliedStatus] = useState('All');
  const [appliedNumber, setAppliedNumber] = useState('');

  const filteredNames = React.useMemo(() => {
    let result = names;
    if (appliedCat !== 'All') {
      const catId = appliedCat.toLowerCase();
      result = result.filter(n => n.category === catId);
    }
    if (appliedStatus === 'Learned') {
      result = result.filter(n => learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    } else if (appliedStatus === 'Mastered') {
      result = result.filter(n => masteredIds.includes(n.number));
    }
    if (appliedNumber && appliedNumber.trim() !== '') {
      const numPattern = parseInt(appliedNumber, 10);
      result = result.filter(n => n.number === numPattern);
    }
    return result;
  }, [names, appliedCat, appliedStatus, appliedNumber, learnedIds, masteredIds]);

  const activeIndexRef = useRef(0);
  const namesRef = useRef(filteredNames);
  const isAnimating = useRef(false);
  const hasSwipedRef = useRef(false);
  const pendingReset = useRef(false);
  const dragProgress = useRef(0);

  useEffect(() => {
    namesRef.current = filteredNames;
    if (filteredNames.length > 0 && activeIndex >= filteredNames.length) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
      pendingReset.current = true;
    }
  }, [filteredNames, activeIndex]);

  // Single value drives all three cards — no setState during gestures
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Reset position atomically before next paint, after activeIndex state update
  useLayoutEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      isAnimating.current = false;
      dragProgress.current = 0;
      scrollAnim.setValue(0);
    }
  }, [activeIndex]);

  const domeOpacity = useRef(new Animated.Value(1)).current;
  const anchorAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const anchorLoopRef = useRef(null);
  const floatLoopRef = useRef(null);

  useEffect(() => {
    anchorLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(anchorAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
        Animated.timing(anchorAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anchorLoopRef.current.start();

    floatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    floatLoopRef.current.start();

    return () => {
      anchorLoopRef.current?.stop();
      floatLoopRef.current?.stop();
    };
  }, []);

  // ── PAN RESPONDER ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gs) => !isAnimating.current && Math.abs(gs.dy) > 8,

      onPanResponderMove: (_, gs) => {
        if (isAnimating.current) return;
        // Pure native-driver setValue — zero JS re-renders during drag
        const v = gs.dy / CARD_SLOT;
        dragProgress.current = v;
        scrollAnim.setValue(v);
      },

      onPanResponderRelease: (_, gs) => {
        if (isAnimating.current) return;

        const enoughDrag = Math.abs(gs.dy) > 80 || Math.abs(gs.vy) > 0.5;
        // Determine direction from current gesture or accumulated drag
        const dir = gs.dy < 0 ? -1 : gs.dy > 0 ? 1 : 0;

        if (!enoughDrag || dir === 0) {
          dragProgress.current = 0;
          Animated.spring(scrollAnim, {
            toValue: 0, tension: 180, friction: 14, useNativeDriver: true,
          }).start();
          return;
        }

        isAnimating.current = true;

        if (!hasSwipedRef.current) {
          hasSwipedRef.current = true;
          anchorLoopRef.current?.stop();
          Animated.timing(domeOpacity, {
            toValue: 0, duration: 400, useNativeDriver: true,
          }).start();
        }

        // Shorter duration if user already dragged most of the way
        const done = Math.min(1, Math.abs(dragProgress.current));
        const duration = Math.max(120, Math.round(300 * (1 - done)));

        Animated.timing(scrollAnim, {
          toValue: dir,
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          const count = namesRef.current.length || 1;
          const nextIdx = dir === -1
            ? (activeIndexRef.current + 1) % count
            : (activeIndexRef.current - 1 + count) % count;
          activeIndexRef.current = nextIdx;
          pendingReset.current = true;
          setActiveIndex(nextIdx);
          // scrollAnim reset + isAnimating=false handled in useLayoutEffect
        });
      },

      onPanResponderTerminate: () => {
        dragProgress.current = 0;
        scrollAnim.setValue(0);
        isAnimating.current = false;
      },
    })
  ).current;
  // ──────────────────────────────────────────────────────────────────────────

  const renderCardContent = (index) => {
    const item = filteredNames[index];
    if (!item) return null;

    const isMastered = masteredIds.includes(item.number);
    const isLearned = learnedIds.includes(item.number) && !isMastered;

    let flagTint = null;
    let badgeColors = ['#FFFFFF', '#FFFFFF'];
    let badgeBorder = '#00ADC150';
    let badgeTextColor = '#1A1A1A';
    let statusText = null;
    let statusIcon = null;

    if (isMastered) {
      flagTint = '#FFC107';
      badgeColors = ['#FFE875', '#FFB300'];
      badgeBorder = 'transparent';
      badgeTextColor = '#1A1A1A';
      statusText = 'Mastered';
      statusIcon = 'shield-checkmark';
    } else if (isLearned) {
      flagTint = '#4CAF50';
      badgeColors = ['#4CD964', '#32CD32'];
      badgeBorder = 'transparent';
      badgeTextColor = '#FFFFFF';
      statusText = 'Learned';
      statusIcon = 'checkmark-circle-outline';
    }

    return (
      <ImageBackground
        source={require('../../assets/nameBgCard.png')}
        style={styles.cardContent}
        resizeMode="cover"
      >
        <View style={styles.bookmarkRibbon}>
          <Image
            source={require('../../assets/flag.png')}
            style={[styles.flagImage, flagTint ? { tintColor: flagTint } : null]}
            resizeMode="contain"
          />
          <View style={styles.bookmarkTextOverlay}>
            <Text style={styles.ribbonText}>{String(item.number).padStart(2, '0')}</Text>
          </View>
        </View>
        <View style={styles.rightBadgeContainer}>
          <LinearGradient
            colors={badgeColors}
            style={[styles.categoryBadge, { borderColor: badgeBorder }]}
          >
            <Text style={[styles.categoryText, { color: badgeTextColor }]}>
              {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General'}
            </Text>
          </LinearGradient>
          {statusText && (
            <View style={styles.statusRow}>
              <Ionicons name={statusIcon} size={14} color="#FFFFFF" />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInner}>
          <Text style={[styles.arabic, { color: '#1A1A1A' }]}>{item.arabic}</Text>
          <Text style={[styles.trans, { color: '#1A1A1A' }]}>{item.transliteration}</Text>
          <Text style={[styles.meaning, { color: '#1A1A1A' }]}>{item.meaning}</Text>
        </View>
        <Image source={require('../../assets/bookQ.png')} style={styles.quranImage} resizeMode="contain" />

        {isLearned && (
          <View style={styles.toMasterHint}>
            <Text style={styles.toMasterTitle}>TO MASTER...</Text>
            <Text style={styles.toMasterDesc}>Read 3 times to earn Master Badge</Text>
          </View>
        )}
      </ImageBackground>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const count = filteredNames.length || 1;
  const prevIdx = (activeIndex - 1 + count) % count;
  const nextIdx = (activeIndex + 1) % count;

  // Three slots with stable keys — React reuses the same views, just updates content
  const cardSlots = [
    { dataIdx: prevIdx, offset: -1 },
    { dataIdx: activeIndex, offset: 0 },
    { dataIdx: nextIdx, offset: +1 },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ── TOP SECTION ── */}
      <View style={[styles.topSection, { height: TOP_SECTION_HEIGHT }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchPill}>
            <Ionicons name="search" size={20} color="#BFBFBF" />
            <Text style={styles.searchPlaceholder}>Name, Meaning, Arabic, .....</Text>
          </View>
          <TouchableOpacity
            style={styles.filterCircle}
            onPress={() => {
              setTempCat(appliedCat);
              setTempStatus(appliedStatus);
              setTempNumber(appliedNumber);
              setFilterVisible(true);
            }}
          >
            <Ionicons name="options-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.bannerContainer}>
          <Image source={require('../../assets/nameHeroCard.png')} style={styles.bannerImage} resizeMode="cover" />
        </View>
        <View style={styles.ornContainer}>
          <Image source={require('../../assets/lineGold.png')} style={styles.goldDivider} resizeMode="contain" />
        </View>
      </View>

      {/* ── CARD STACK ENGINE ── */}
      <View style={styles.stackEngine} {...panResponder.panHandlers}>

        {filteredNames.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="document-text-outline" size={48} color="#ADC1D2" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, color: '#1A1A1A', fontWeight: '600' }}>No names match your filter.</Text>
            <Text style={{ fontSize: 14, color: '#7A7A7A', marginTop: 8 }}>Try adjusting your search criteria.</Text>
          </View>
        ) : (
          <>
            {/* BOTTOM: stack peek frames + dome (behind all cards) */}
            <View style={styles.bottomArea}>
              {STACK_CONFIG.map((config, idx) => {
                const nextConfig = idx === 2
                  ? { width: CARD_W, height: CARD_H, opacity: 1, bottom: 35 }
                  : STACK_CONFIG[idx + 1];

                const sX = nextConfig.width / config.width;
                const sY = nextConfig.height / config.height;
                const tY = -(nextConfig.bottom - config.bottom);

                const floatOffset = floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, idx === 0 ? -6 : idx === 1 ? -10 : -14]
                });

                // Stack advances only on swipe-up (scrollAnim < 0 = next card direction)
                return (
                  <Animated.View key={idx} style={[styles.peekFrame, {
                    width: config.width,
                    height: config.height,
                    bottom: 80 + config.bottom,
                    zIndex: idx + 1,
                    opacity: scrollAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [nextConfig.opacity, config.opacity, config.opacity],
                      extrapolate: 'clamp',
                    }),
                    transform: [
                      {
                        translateY: Animated.add(
                          scrollAnim.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [tY, 0, 0],
                            extrapolate: 'clamp',
                          }),
                          floatOffset
                        ),
                      },
                    ],
                  }]} />
                );
              })}

              {/* DOME — fades on first swipe */}
              <Animated.View style={[styles.dome, {
                opacity: domeOpacity,
                transform: [{ translateY: anchorAnim }],
              }]}>
                <Text style={styles.domeLabel}>Swipe to find next</Text>
                <Image source={require('../../assets/newAnchor.png')} style={styles.anchorImg} resizeMode="contain" />
              </Animated.View>
            </View>

            {/* THREE CARD SLOTS — stable keys, no mount/unmount on transition */}
            {cardSlots.map(({ dataIdx, offset }) => (
              <Animated.View
                key={`slot${offset}`}
                style={[styles.baseCardWrapper, {
                  zIndex: offset === 0 ? 10 : 30,
                  opacity: scrollAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: offset === -1 ? [0, 0, 1]
                      : offset === 0 ? [1, 1, 1]
                        : [1, 0, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      translateY: scrollAnim.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: offset === -1 ? [-CARD_SLOT, -CARD_SLOT, 0]
                          : offset === 0 ? [0, 0, 0]
                            : [0, CARD_SLOT, CARD_SLOT],
                        extrapolate: 'clamp',
                      }),
                    }
                  ],
                }]}
              >
                {/* Center card is tappable → navigates to detail screen */}
                {offset === 0 ? (
                  <TouchableOpacity
                    style={styles.mainCard}
                    activeOpacity={0.92}
                    onPress={() => {
                      if (isAnimating.current) return;
                      const item = filteredNames[dataIdx];
                      if (item) navigation.navigate('NameDetail', { name: item });
                    }}
                  >
                    {renderCardContent(dataIdx)}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.mainCard}>
                    {renderCardContent(dataIdx)}
                  </View>
                )}
              </Animated.View>
            ))}
          </>
        )}

      </View>

      {/* ── FILTER MODAL ── */}
      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.filterSectionTitle}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
              {['All', ...(categories ? Object.keys(categories).map(k => k.charAt(0).toUpperCase() + k.slice(1)) : [])].map(cat => {
                const isActive = tempCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setTempCat(cat)}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.filterSectionTitle}>STATUS</Text>
            <View style={styles.filterRow}>
              {['All', 'Learned', 'Mastered'].map(status => {
                const isActive = tempStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setTempStatus(status)}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{status}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterSectionTitle}>NAMES</Text>
            <View style={styles.namesFilterRow}>
              <Text style={styles.namesFilterLabel}>Select the name number</Text>
              <View style={styles.numberInputBox}>
                <TextInput
                  style={styles.numberInput}
                  value={tempNumber}
                  onChangeText={setTempNumber}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="--"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => {
                setAppliedCat(tempCat);
                setAppliedStatus(tempStatus);
                setAppliedNumber(tempNumber);
                setActiveIndex(0);
                activeIndexRef.current = 0;
                pendingReset.current = true;
                setFilterVisible(false);
              }}
            >
              <Text style={styles.applyFilterBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDF1F9' },
  topSection: { paddingHorizontal: 20, paddingTop: 10, zIndex: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15, marginTop: 5 },
  searchPill: { flex: 1, height: 52, backgroundColor: '#FFFFFF', borderRadius: 26, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, elevation: 2 },
  searchPlaceholder: { color: '#BFBFBF', fontSize: 14 },
  filterCircle: { width: 52, height: 52, backgroundColor: '#FFFFFF', borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  bannerContainer: { height: '55%', borderRadius: 24, overflow: 'hidden', marginBottom: 10 },
  bannerImage: { width: '100%', height: '100%' },
  ornContainer: { alignItems: 'center', height: 30, top: -35 },
  goldDivider: { width: '120%', height: '210%' },

  stackEngine: { flex: 1, alignItems: 'center', position: 'relative' },

  baseCardWrapper: {
    position: 'absolute',
    top: 10,
    width: CARD_W,
    height: CARD_H,
    elevation: 20,
  },
  mainCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00ADC1',
  },

  cardContent: { flex: 1 },
  cardInner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  arabic: { fontSize: 28, fontFamily: FONTS.arabic, textAlign: 'center', marginBottom: 2 },
  trans: { fontSize: 35, fontWeight: '400', textAlign: 'center', color: '#1A1A1A', marginBottom: 4 },
  meaning: { fontSize: 20, fontWeight: '400', textAlign: 'center' },

  bookmarkRibbon: { position: 'absolute', top: -5, left: 15, width: 44, height: 66, zIndex: 10 },
  flagImage: { width: '100%', height: '100%' },
  bookmarkTextOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingTop: 6 },
  ribbonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  rightBadgeContainer: { position: 'absolute', top: 20, right: 20, alignItems: 'flex-end', zIndex: 10 },
  categoryBadge: { paddingHorizontal: 20, paddingVertical: 5, borderRadius: 4, borderWidth: 1, minWidth: 90, alignItems: 'center' },
  categoryText: { fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, paddingRight: 4 },
  statusText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  toMasterHint: { position: 'absolute', bottom: 20, left: 20, zIndex: 10 },
  toMasterTitle: { fontSize: 16, color: '#A0A0A0', fontWeight: '800', letterSpacing: 0.5 },
  toMasterDesc: { fontSize: 10, color: '#1A1A1A', fontWeight: '600', marginTop: 2 },

  quranImage: { position: 'absolute', bottom: 15, right: 15, width: 110, height: 110 },

  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', height: 180, zIndex: 5 },
  peekFrame: { position: 'absolute', borderRadius: 12, backgroundColor: '#FFFFFF', alignSelf: 'center', borderWidth: 1, borderColor: '#00ADC1' },

  dome: {
    position: 'absolute', bottom: 70,
    width: 230, height: 115,
    borderTopLeftRadius: 115, borderTopRightRadius: 115,
    backgroundColor: '#00ADC1',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#00ADC1', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 }, elevation: 15,
  },
  domeLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4, marginVertical: 8 },
  anchorImg: { width: 48, height: 48 },

  // ── FILTER MODAL ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },

  filterSectionTitle: { fontSize: 12, fontWeight: '800', color: '#1A1A1A', marginTop: 16, marginBottom: 10, letterSpacing: 0.5 },
  filterScroll: { flexGrow: 0, marginBottom: 16 },
  filterScrollContent: { gap: 10, paddingRight: 20 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  filterPill: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#DADBDF', borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  filterPillActive: { backgroundColor: '#E0F6F9', borderColor: '#00ADC1' },
  filterPillText: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  filterPillTextActive: { color: '#00ADC1' },

  namesFilterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  namesFilterLabel: { fontSize: 13, color: '#4A4A4A' },
  numberInputBox: { backgroundColor: '#DADBDF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4 },
  numberInput: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },

  applyFilterBtn: { width: '100%', backgroundColor: '#00ADC1', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  applyFilterBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

});

export default NamesScreen;
