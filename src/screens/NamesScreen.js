import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, PanResponder,
  Image, ActivityIndicator, TouchableOpacity, Easing, ImageBackground,
  Modal, ScrollView, TextInput, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, G, Circle } from 'react-native-svg';
import FlagSvg from '../../assets/names/flag.svg';
import { useNames } from '../context/NamesContext';
import { FONTS } from '../theme';
import TimeBasedBackground from '../components/TimeBasedBackground';
import http from '../config/http';

const { width: SW, height: SH } = Dimensions.get('window');

// Scale helpers — reference device: Redmi Note 13 Pro+ (≈393 × 900 dp)
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);  // scale by screen width
const hs = (n) => Math.round(n * hScale);  // scale by screen height

const TOP_SECTION_HEIGHT = hs(220);
const CARD_W = SW - 36;
const CARD_H = hs(351);
const CARD_SLOT = CARD_H + rs(60);

const DOME_W = rs(230);
const DOME_H = hs(115);

const STACK_CONFIG = [
  { width: SW - rs(110), height: hs(100), opacity: 0.25, bottom: hs(-30) },
  { width: SW - rs(160), height: hs(100), opacity: 0.5, bottom: hs(-50) },
  { width: SW - rs(220), height: hs(50), opacity: 0.8, bottom: hs(-20) },
];

const TextureBlob = ({ style }) => (
  <Svg width={rs(130)} height={hs(130)} viewBox="0 0 160 160" style={style}>
    <Defs>
      <SvgLinearGradient id="blobGrad" x1="0" y1="1" x2="0.9" y2="0" gradientUnits="objectBoundingBox">
        <Stop offset="0" stopColor="#02889D" stopOpacity="0.9" />
        <Stop offset="0.55" stopColor="#03B7CE" stopOpacity="0.65" />
        <Stop offset="1" stopColor="#4BD5E8" stopOpacity="0.05" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M 0 160 C 5 130 15 105 38 88 C 60 70 90 72 110 55 C 130 38 128 12 112 3 C 95 -6 70 3 52 18 C 34 33 18 62 10 88 C 2 114 0 140 0 160 Z"
      fill="url(#blobGrad)"
    />
  </Svg>
);

const NameCardBackground = ({ width, height, style }) => {
  const r = Math.min(rs(16), height * 0.16);
  const nw = width * 0.45;
  const nh = height * 0.046;
  const nr = Math.min(rs(6), nh * 0.375);

  const x1 = (width - nw) / 2;
  const x2 = (width + nw) / 2;

  const d = `
    M ${r} 0
    L ${width - r} 0
    A ${r} ${r} 0 0 1 ${width} ${r}
    L ${width} ${height - r}
    A ${r} ${r} 0 0 1 ${width - r} ${height}
    L ${x2 + nr} ${height}
    A ${nr} ${nr} 0 0 1 ${x2} ${height - nr}
    L ${x2} ${height - nh + nr}
    A ${nr} ${nr} 0 0 0 ${x2 - nr} ${height - nh}
    L ${x1 + nr} ${height - nh}
    A ${nr} ${nr} 0 0 0 ${x1} ${height - nh + nr}
    L ${x1} ${height - nr}
    A ${nr} ${nr} 0 0 1 ${x1 - nr} ${height}
    L ${r} ${height}
    A ${r} ${r} 0 0 1 0 ${height - r}
    L 0 ${r}
    A ${r} ${r} 0 0 1 ${r} 0
    Z
  `.replace(/\s+/g, ' ').trim();

  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#BCECF7" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={d}
          fill="url(#cardGrad)"
          stroke="#A0DCE9"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
};

const NamesScreen = ({ navigation }) => {
  const { names, loading, learnedIds, masteredIds, categories } = useNames();
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastReadName, setLastReadName] = useState(null);

  useEffect(() => {
    const fetchLastRead = async () => {
      try {
        const res = await http.get('/api/progress');
        if (res.data?.success && res.data?.data?.progress) {
          const progressList = res.data.data.progress;
          if (progressList.length > 0) {
            // Sort by lastRevisitAt DESC
            const sorted = [...progressList].sort(
              (a, b) => new Date(b.lastRevisitAt) - new Date(a.lastRevisitAt)
            );
            const latest = sorted[0];
            const nameObj = names.find(n => n.number === latest.nameNumber);
            if (nameObj) {
              setLastReadName(nameObj);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch last read name progress', err.message);
      }
    };

    if (names.length > 0) {
      fetchLastRead();
    }
  }, [names]);

  const handleBackToReading = () => {
    if (!lastReadName) return;

    // Reset filters
    setSearchQuery('');
    setAppliedCat('All');
    setAppliedStatus('All');
    setAppliedNumber('');

    setTimeout(() => {
      const idx = names.findIndex(n => n.number === lastReadName.number);
      if (idx !== -1) {
        setActiveIndex(idx);
        activeIndexRef.current = idx;
        scrollAnim.setValue(0);
      }
    }, 50);
  };

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
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(n =>
        (n.transliteration && n.transliteration.toLowerCase().includes(q)) ||
        (n.meaning && n.meaning.toLowerCase().includes(q)) ||
        (n.arabic && n.arabic.includes(searchQuery.trim()))
      );
    }
    return result;
  }, [names, appliedCat, appliedStatus, appliedNumber, searchQuery, learnedIds, masteredIds]);

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

  const scrollAnim = useRef(new Animated.Value(0)).current;

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
        const v = gs.dy / CARD_SLOT;
        dragProgress.current = v;
        scrollAnim.setValue(v);
      },

      onPanResponderRelease: (_, gs) => {
        if (isAnimating.current) return;

        const enoughDrag = Math.abs(gs.dy) > 80 || Math.abs(gs.vy) > 0.5;
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
      <View style={styles.cardContent}>
        <NameCardBackground width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFillObject} />
        <TextureBlob style={styles.leftTexture} />
        <TextureBlob style={styles.rightTexture} />
        <View style={styles.bookmarkRibbon}>
          <Image
            source={require('../../assets/names/flag.png')}
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
              <Ionicons name={statusIcon} size={rs(14)} color="#FFFFFF" />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}
        </View>
        <View style={[styles.cardInner, isLearned && { paddingBottom: hs(75) }]}>
          <Text style={[styles.arabic, { color: '#1A1A1A' }]}>{item.arabic}</Text>
          <Text style={[styles.trans, { color: '#1A1A1A' }]}>{item.transliteration}</Text>
          <Text style={[styles.meaning, { color: '#555555' }]}>{item.meaning}</Text>
        </View>

        {isLearned && (
          <View style={styles.toMasterHint}>
            <Text style={styles.toMasterTitle}>TO MASTER...</Text>
            <Text style={styles.toMasterDesc}>Read 3 times to earn Master Badge</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const count = filteredNames.length || 1;
  const prevIdx = (activeIndex - 1 + count) % count;
  const nextIdx = (activeIndex + 1) % count;

  const cardSlots = [
    { dataIdx: prevIdx, offset: -1 },
    { dataIdx: activeIndex, offset: 0 },
    { dataIdx: nextIdx, offset: +1 },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            {/* ── TOP SECTION ── */}
            <View style={styles.topSection}>
              <View style={styles.headerContainer}>
                <View style={styles.headerDividerRow}>
                  <View style={styles.headerLine} />
                  <Text style={styles.headerDiamond}>✦</Text>
                  <View style={styles.headerLine} />
                </View>
                <Text style={styles.headerTitleText}>99 Names of Allah</Text>
                <View style={styles.headerDividerRow}>
                  <View style={styles.headerLine} />
                  <Text style={styles.headerDiamond}>✦</Text>
                  <View style={styles.headerLine} />
                </View>
              </View>

              <View style={styles.lastReadCardWrapper}>
                <LinearGradient
                  colors={['#4BD5E8', '#FDFEFE']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.9 }}
                  style={styles.lastReadCard}
                >
                  <View style={styles.lastReadLeft}>
                    <View style={styles.lastReadBadge}>
                      <Image
                        source={require('../../assets/navigation/names.png')}
                        style={styles.lastReadBadgeIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.lastReadBadgeText}>Last Read</Text>
                    </View>

                    <View style={styles.lastReadTextGroup}>
                      <Text style={styles.lastReadArabic}>{lastReadName?.arabic || 'الرحمن'}</Text>
                      <Text style={styles.lastReadTrans}>{lastReadName?.transliteration || 'Ar-rahman'}</Text>
                      <Text style={styles.lastReadMeaning}>{lastReadName?.meaning || 'The Most Gracious'}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.backToReadingBtn}
                      activeOpacity={0.8}
                      onPress={handleBackToReading}
                    >
                      <Text style={styles.backToReadingText}>Back to reading</Text>
                      <Ionicons name="chevron-forward" size={15} color="#ffffff" style={{ marginLeft: 20, marginTop: 4 }} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.lastReadRight}>
                    <Image
                      source={require('../../assets/names/book.png')}
                      style={styles.lastReadBookImage}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* ── CARD STACK ENGINE ── */}
            <View style={styles.stackEngine} {...panResponder.panHandlers}>

              {filteredNames.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={rs(48)} color="#ADC1D2" style={{ marginBottom: rs(16) }} />
                  <Text style={{ fontSize: rs(16), color: '#1A1A1A', fontWeight: '600' }}>No names match your filter.</Text>
                  <Text style={{ fontSize: rs(14), color: '#7A7A7A', marginTop: rs(8) }}>Try adjusting your search criteria.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.bottomArea}>
                    {STACK_CONFIG.map((config, idx) => {
                      const nextConfig = idx === 2
                        ? { width: CARD_W, height: CARD_H, opacity: 1, bottom: hs(35) }
                        : STACK_CONFIG[idx + 1];

                      const tY = -(nextConfig.bottom - config.bottom);

                      const floatOffset = floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, idx === 0 ? -6 : idx === 1 ? -10 : -14]
                      });

                      return (
                        <Animated.View key={idx} style={[styles.peekFrame, {
                          width: config.width,
                          height: config.height,
                          bottom: hs(80) + config.bottom,
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
                        }]}>
                          <NameCardBackground width={config.width} height={config.height} style={StyleSheet.absoluteFillObject} />
                        </Animated.View>
                      );
                    })}

                    <Animated.View style={[styles.dome, {
                      opacity: domeOpacity,
                      transform: [{ translateY: anchorAnim }],
                    }]}>
                      <Text style={styles.domeLabel}>Swipe to find next</Text>
                      <Image source={require('../../assets/names/new_anchor.png')} style={styles.anchorImg} resizeMode="contain" />
                    </Animated.View>
                  </View>

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
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topSection: { paddingHorizontal: rs(20), paddingTop: hs(15), zIndex: 30 },
  headerContainer: {
    alignItems: 'center',
    marginBottom: hs(15),
  },
  headerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: rs(140),
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#0891b2',
    opacity: 0.35,
  },
  headerDiamond: {
    color: '#0891b2',
    fontSize: rs(10),
    marginHorizontal: rs(6),
  },
  headerTitleText: {
    fontFamily: FONTS.bold,
    fontSize: rs(18),
    color: '#0891b2',
    marginVertical: hs(4),
    textAlign: 'center',
  },
  lastReadCardWrapper: {
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: hs(16),
  },
  lastReadCard: {
    flexDirection: 'row',
    borderRadius: rs(10),
    paddingVertical: hs(12),
    paddingHorizontal: rs(16),
    height: hs(180),
    position: 'relative',
    overflow: 'visible',
  },
  lastReadLeft: {
    flex: 1.2,
    justifyContent: 'center',
    zIndex: 2,
  },
  lastReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastReadBadgeIcon: {
    width: rs(14),
    height: rs(14),
    marginTop: hs(2),
    tintColor: '#000000',
  },
  lastReadBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: rs(12),
    color: '#000000',
    marginLeft: 2,
  },
  lastReadTextGroup: {
    marginTop: hs(20),
    marginBottom: hs(20),
  },
  lastReadArabic: {
    fontSize: rs(10),
    fontFamily: FONTS.arabic,
    color: '#000000ff',
  },
  lastReadTrans: {
    fontFamily: FONTS.bold,
    fontSize: rs(18),
    color: '#000000',
    lineHeight: rs(22),
  },
  lastReadMeaning: {
    fontFamily: FONTS.medium,
    fontSize: rs(10),
    color: '#374151',
  },
  backToReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: rs(8),
    paddingHorizontal: rs(14),
    paddingVertical: hs(8),
    alignSelf: 'flex-start',
    marginTop: hs(2),
  },
  backToReadingText: {
    fontFamily: FONTS.medium,
    fontSize: rs(12),
    color: '#ffffff',
  },
  lastReadRight: {
    flex: 0.8,
    position: 'relative',
    overflow: 'visible',
  },
  lastReadBookImage: {
    position: 'absolute',
    right: rs(-80),
    top: hs(10),
    width: rs(140),
    height: hs(140),
    zIndex: 3,
    transform: [{ rotate: '-6deg' }],
  },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: hs(10), marginTop: hs(4) },
  searchPill: { flex: 1, height: rs(38), backgroundColor: '#FFFFFF', borderRadius: rs(19), flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), gap: rs(8), elevation: 2 },
  searchInput: { flex: 1, fontSize: rs(13), color: '#1A1A1A', paddingVertical: 0, height: rs(38) },
  filterCircle: { width: rs(38), height: rs(38), backgroundColor: '#FFFFFF', borderRadius: rs(19), justifyContent: 'center', alignItems: 'center', elevation: 2 },

  stackEngine: { flex: 1, alignItems: 'center', position: 'relative' },

  baseCardWrapper: {
    position: 'absolute',
    top: hs(50),
    width: CARD_W,
    height: CARD_H,
    shadowColor: '#00ADC1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  mainCard: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },

  cardContent: { flex: 1 },
  leftTexture: { position: 'absolute', bottom: 0, left: 0 },
  rightTexture: { position: 'absolute', bottom: 0, right: 0, transform: [{ scaleX: -1 }] },
  cardInner: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start', paddingLeft: rs(24), paddingBottom: hs(35) },
  arabic: { fontSize: rs(28), fontFamily: FONTS.arabic, textAlign: 'left', marginBottom: hs(4) },
  trans: { fontSize: rs(35), fontWeight: '700', textAlign: 'left', color: '#1A1A1A', marginBottom: hs(4) },
  meaning: { fontSize: rs(18), fontWeight: '500', textAlign: 'left' },

  bookmarkRibbon: { position: 'absolute', top: hs(-5), left: rs(15), width: rs(44), height: hs(66), zIndex: 10 },
  flagImage: { width: '100%', height: '100%' },
  bookmarkTextOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingTop: hs(6) },
  ribbonText: { color: '#FFF', fontSize: rs(18), fontWeight: '700' },

  rightBadgeContainer: { position: 'absolute', top: hs(20), right: rs(20), alignItems: 'flex-end', zIndex: 10 },
  categoryBadge: { paddingHorizontal: rs(20), paddingVertical: hs(5), borderRadius: rs(4), borderWidth: 1, minWidth: rs(90), alignItems: 'center' },
  categoryText: { fontSize: rs(16), fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: hs(4), gap: rs(4), paddingRight: rs(4) },
  statusText: { color: '#FFFFFF', fontSize: rs(13), fontWeight: '600' },

  toMasterHint: { position: 'absolute', bottom: hs(20), left: rs(20), zIndex: 10 },
  toMasterTitle: { fontSize: rs(16), color: '#A0A0A0', fontWeight: '800', letterSpacing: 0.5 },
  toMasterDesc: { fontSize: rs(10), color: '#1A1A1A', fontWeight: '600', marginTop: hs(2) },

  quranImage: { position: 'absolute', bottom: hs(15), right: rs(15), width: rs(110), height: rs(110) },

  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', height: hs(180), zIndex: 5 },
  peekFrame: { position: 'absolute', alignSelf: 'center' },

  dome: {
    position: 'absolute', bottom: hs(70),
    width: DOME_W, height: DOME_H,
    borderTopLeftRadius: DOME_W / 2, borderTopRightRadius: DOME_W / 2,
    backgroundColor: '#00ADC1',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#00ADC1', shadowOpacity: 0.2, shadowRadius: rs(10),
    shadowOffset: { width: 0, height: -3 }, elevation: 15,
  },
  domeLabel: { color: '#FFFFFF', fontSize: rs(16), fontWeight: '700', letterSpacing: 0.4, marginVertical: hs(8) },
  anchorImg: { width: rs(48), height: rs(48) },

  // ── FILTER MODAL ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), padding: rs(24), paddingBottom: hs(40) },
  modalHandle: { width: rs(40), height: hs(4), backgroundColor: '#E0E0E0', borderRadius: rs(2), alignSelf: 'center', marginBottom: hs(24) },

  filterSectionTitle: { fontSize: rs(12), fontWeight: '800', color: '#1A1A1A', marginTop: hs(16), marginBottom: hs(10), letterSpacing: 0.5 },
  filterScroll: { flexGrow: 0, marginBottom: hs(16) },
  filterScrollContent: { gap: rs(10), paddingRight: rs(20) },
  filterRow: { flexDirection: 'row', gap: rs(10), marginBottom: hs(16) },

  filterPill: { paddingHorizontal: rs(20), paddingVertical: hs(8), backgroundColor: '#DADBDF', borderRadius: rs(16), borderWidth: 1, borderColor: 'transparent' },
  filterPillActive: { backgroundColor: '#E0F6F9', borderColor: '#00ADC1' },
  filterPillText: { fontSize: rs(13), color: '#1A1A1A', fontWeight: '500' },
  filterPillTextActive: { color: '#00ADC1' },

  namesFilterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(30), gap: rs(15) },
  namesFilterLabel: { fontSize: rs(13), color: '#4A4A4A' },
  numberInputBox: { backgroundColor: '#DADBDF', borderRadius: rs(6), paddingHorizontal: rs(12), paddingVertical: hs(4) },
  numberInput: { fontSize: rs(14), fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },

  applyFilterBtn: { width: '100%', backgroundColor: '#00ADC1', borderRadius: rs(12), paddingVertical: hs(16), alignItems: 'center' },
  applyFilterBtnText: { color: '#FFFFFF', fontSize: rs(16), fontWeight: '700' },

});

export default NamesScreen;
