import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, PanResponder,
  Image, ActivityIndicator, TouchableOpacity, Easing, ImageBackground,
  Modal, ScrollView, TextInput, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, G, Circle } from 'react-native-svg';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { FONTS } from '../theme';
import TimeBasedBackground from '../components/TimeBasedBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import http from '../config/http';
import { useAppTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

const { width: SW, height: SH } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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


const STACK_CONFIG = [
  { width: SW - rs(110), height: hs(100), opacity: 0.25, bottom: hs(-30) },
  { width: SW - rs(160), height: hs(100), opacity: 0.5, bottom: hs(-50) },
  { width: SW - rs(220), height: hs(50), opacity: 0.8, bottom: hs(-20) },
];

// Bottom-sheet snap points — these are the 'top' Y values of the sheet panel.
// The sheet has bottom:0 (anchored to screen bottom) so its height = SH - top.
const BS_HIDDEN = SH;          // top == screen bottom → sheet fully hidden
const BS_PEEK = SH * 0.44;   // sheet occupies bottom 56 % of screen
const BS_EXPANDED = SH * 0.10;   // sheet occupies bottom 90 % of screen

const NameCardBackground = ({ width, height, style, gradEnd = '#BCECF7', strokeColor = '#A0DCE9' }) => {
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
            <Stop offset="0" stopColor={['#1A2332', '#062f1d', '#332700', '#665200'].includes(gradEnd) ? '#0F172A' : '#FFFFFF'} />
            <Stop offset="1" stopColor={gradEnd} />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={d}
          fill="url(#cardGrad)"
        />
      </Svg>
    </View>
  );
};

const NamesScreen = ({ navigation, route }) => {
  const { names, loading, learnedIds, masteredIds, revisitCounts, categories, markAsViewed, readingTimeToday, draftIds } = useNames();
  const { favouriteIds } = usePlaylist();
  const { isDark, colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  // Ref that signals the filteredNames effect to skip card-preservation and
  // honour an explicit navigation jump instead.
  const isNavigatingRef = useRef(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [tempCat, setTempCat] = useState('All');
  const [tempStatus, setTempStatus] = useState('All');
  const [tempNumber, setTempNumber] = useState('');

  const [totalReadingSeconds, setTotalReadingSeconds] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const calculateTotalLearning = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const nameKeys = keys.filter(k => k.startsWith('reading_time_name_'));
          if (nameKeys.length > 0) {
            const values = await AsyncStorage.multiGet(nameKeys);
            let total = 0;
            values.forEach(([key, val]) => {
              if (val) total += parseInt(val, 10) || 0;
            });
            setTotalReadingSeconds(total);
          } else {
            setTotalReadingSeconds(0);
          }
        } catch (e) {
          console.warn('Error calculating total learning:', e);
        }
      };
      calculateTotalLearning();
    }, [])
  );

  const formattedReadingTime = React.useMemo(() => {
    if (!totalReadingSeconds) return '0m';
    const h = Math.floor(totalReadingSeconds / 3600);
    const m = Math.floor((totalReadingSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [totalReadingSeconds]);

  const draftCount = draftIds ? draftIds.length : 0;
  const favCount = favouriteIds ? favouriteIds.size : 0;

  const [appliedCat, setAppliedCat] = useState('All');
  const [appliedStatus, setAppliedStatus] = useState('All');
  const [appliedNumber, setAppliedNumber] = useState('');

  const filteredNames = React.useMemo(() => {
    let result = names;
    if (appliedCat !== 'All') {
      result = result.filter(n => n.category === appliedCat);
    }
    if (appliedStatus === 'Learned') {
      result = result.filter(n => learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    } else if (appliedStatus === 'Mastered') {
      result = result.filter(n => masteredIds.includes(n.number));
    } else if (appliedStatus === 'Remaining') {
      result = result.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
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
  const pendingReset = useRef(false);
  const dragProgress = useRef(0);

  useEffect(() => {
    if (route?.params) {
      const p = route.params;
      let changed = false;

      let newCat = appliedCat;
      if (p.filter !== undefined) {
        newCat = p.filter
          ? p.filter.toLowerCase()
          : 'All';
        if (newCat !== appliedCat) {
          setAppliedCat(newCat);
          setTempCat(newCat);
          changed = true;
        }
      }

      let newStatus = appliedStatus;
      if (p.statusFilter !== undefined) {
        newStatus = p.statusFilter
          ? p.statusFilter.charAt(0).toUpperCase() + p.statusFilter.slice(1)
          : 'All';
        if (newStatus !== appliedStatus) {
          setAppliedStatus(newStatus);
          setTempStatus(newStatus);
          changed = true;
        }
      }

      if (changed) {
        isNavigatingRef.current = true;
        setActiveIndex(0);
        activeIndexRef.current = 0;
        pendingReset.current = true;
      }
    }
  }, [route?.params]);


  useEffect(() => {
    namesRef.current = filteredNames;

    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    // Only correct out-of-bounds; never reorder mid-swipe
    if (filteredNames.length > 0 && activeIndexRef.current >= filteredNames.length) {
      activeIndexRef.current = 0;
      pendingReset.current = true;
      setActiveIndex(0);
    }
  }, [filteredNames]);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);

  useLayoutEffect(() => {
    if (pendingReset.current) {
      pendingReset.current = false;
      isAnimating.current = false;
      dragProgress.current = 0;
      scrollAnim.setValue(0);
    }
  }, [activeIndex]);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatLoopRef = useRef(null);

  useEffect(() => {
    floatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    floatLoopRef.current.start();

    return () => {
      floatLoopRef.current?.stop();
    };
  }, []);

  const isFilteredRef = useRef(false);
  useEffect(() => {
    isFilteredRef.current = appliedCat !== 'All' || appliedStatus !== 'All' || (appliedNumber && appliedNumber.trim() !== '') || (searchQuery && searchQuery.trim() !== '');
  }, [appliedCat, appliedStatus, appliedNumber, searchQuery]);

  useEffect(() => {
    if (!filterVisible) return;
    sheetAnim.setValue(BS_HIDDEN);
    sheetStateRef.current = 'peek';
    // useNativeDriver:false because we animate the 'top' layout property
    Animated.spring(sheetAnim, { toValue: BS_PEEK, bounciness: 5, speed: 12, useNativeDriver: false }).start();
  }, [filterVisible]);

  // ── PAN RESPONDER ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gs) => !isAnimating.current && Math.abs(gs.dy) > 8,

      onPanResponderMove: (_, gs) => {
        if (isAnimating.current) return;
        let v = gs.dy / CARD_SLOT;

        if (activeIndexRef.current === 0 && gs.dy > 0) {
          v = Math.max(0, (gs.dy / CARD_SLOT) * 0.2); // Rubber band
        } else if (isFilteredRef.current && activeIndexRef.current === namesRef.current.length && gs.dy < 0) {
          v = Math.min(0, (gs.dy / CARD_SLOT) * 0.2); // Rubber band
        }

        dragProgress.current = v;
        scrollAnim.setValue(v);
      },

      onPanResponderRelease: (_, gs) => {
        if (isAnimating.current) return;

        let enoughDrag = Math.abs(gs.dy) > 80 || Math.abs(gs.vy) > 0.5;
        let dir = gs.dy < 0 ? -1 : gs.dy > 0 ? 1 : 0;

        if (activeIndexRef.current === 0 && dir === 1) { enoughDrag = false; dir = 0; }
        if (isFilteredRef.current && activeIndexRef.current === namesRef.current.length && dir === -1) { enoughDrag = false; dir = 0; }

        if (!enoughDrag || dir === 0) {
          dragProgress.current = 0;
          Animated.spring(scrollAnim, {
            toValue: 0, tension: 180, friction: 14, useNativeDriver: true,
          }).start();
          return;
        }

        isAnimating.current = true;

        const count = namesRef.current.length || 1;
        const totalSlots = isFilteredRef.current ? count + 1 : count;

        const done = Math.min(1, Math.abs(dragProgress.current));
        const duration = Math.max(100, Math.round(250 * (1 - done)));

        Animated.timing(scrollAnim, {
          toValue: dir,
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;

          const nextIdx = dir === -1
            ? (isFilteredRef.current ? activeIndexRef.current + 1 : (activeIndexRef.current + 1) % count)
            : (isFilteredRef.current ? activeIndexRef.current - 1 : (activeIndexRef.current - 1 + count) % count);

          scrollAnim.setValue(0);
          isAnimating.current = false;
          dragProgress.current = 0;

          activeIndexRef.current = nextIdx;
          setActiveIndex(nextIdx);
        });
      },

      onPanResponderTerminate: () => {
        dragProgress.current = 0;
        isAnimating.current = false;
        scrollAnim.setValue(0);
      },
    })
  ).current;
  // ──────────────────────────────────────────────────────────────────────────

  // ── BOTTOM SHEET ────────────────────────────────────────────────────────────
  // sheetAnim drives the CSS 'top' of the sheet (not translateY).
  // bottom:0 is fixed, so sheet height = SH - sheetAnim.
  // This keeps the Apply button always anchored to the screen edge.
  const sheetAnim = useRef(new Animated.Value(BS_HIDDEN)).current;
  const sheetValRef = useRef(BS_HIDDEN);

  useEffect(() => {
    const id = sheetAnim.addListener(({ value }) => {
      sheetValRef.current = value;
    });
    return () => {
      sheetAnim.removeListener(id);
    };
  }, [sheetAnim]);

  const sheetStateRef = useRef('hidden'); // 'hidden' | 'peek' | 'expanded'
  const bsDragStart = useRef(0);

  const sheetPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => {
      // Only claim clearly-vertical gestures so horizontal chip scrolls aren't blocked
      return Math.abs(gs.dy) >= 10 && Math.abs(gs.dy) >= Math.abs(gs.dx) * 1.8;
    },
    onMoveShouldSetPanResponderCapture: (_, gs) => {
      return Math.abs(gs.dy) >= 10 && Math.abs(gs.dy) >= Math.abs(gs.dx) * 1.8;
    },
    onPanResponderGrant: () => { bsDragStart.current = sheetValRef.current; },
    onPanResponderMove: (_, gs) => {
      // Dragging down increases 'top' (shrinks sheet); clamp to [BS_EXPANDED, BS_HIDDEN]
      sheetAnim.setValue(Math.min(BS_HIDDEN, Math.max(BS_EXPANDED, bsDragStart.current + gs.dy)));
    },
    onPanResponderRelease: (_, gs) => {
      const curTop = sheetValRef.current;
      const vel = gs.vy;

      let target;
      // Fast downward swipe OR dragged past 45 % of the peek→hidden range → dismiss
      if (vel > 0.6 || curTop > BS_PEEK + (BS_HIDDEN - BS_PEEK) * 0.45) {
        target = BS_HIDDEN;
        // Fast upward swipe OR dragged past midpoint between expanded and peek → expand
      } else if (vel < -0.4 || curTop < (BS_EXPANDED + BS_PEEK) / 2) {
        target = BS_EXPANDED;
      } else {
        target = BS_PEEK;
      }

      if (target === BS_HIDDEN) {
        Animated.timing(sheetAnim, {
          toValue: BS_HIDDEN, duration: 280,
          easing: Easing.out(Easing.ease), useNativeDriver: false,
        }).start(() => {
          setFilterVisible(false);
          sheetStateRef.current = 'hidden';
        });
      } else {
        sheetStateRef.current = target === BS_EXPANDED ? 'expanded' : 'peek';
        Animated.spring(sheetAnim, { toValue: target, bounciness: 5, speed: 14, useNativeDriver: false }).start();
      }
    },
    onPanResponderTerminate: () => { },
  })).current;


  const renderCardContent = (index) => {
    if (isFilteredRef.current && index === filteredNames.length) {
      const gradEnd = isDark ? '#1A2332' : '#BCECF7';
      const strokeColor = isDark ? '#2A3A50' : '#A0DCE9';
      const badgeBg = isDark ? '#000000' : '#0B0C0C';
      const badgeTextColor = '#4BD5E8';
      const badgeIcon = 'checkmark-circle';
      const catId = appliedCat ? appliedCat.toLowerCase() : '';
      const catObj = categories && categories[catId] ? categories[catId] : null;
      const displayCat = catObj ? catObj.name.toUpperCase() : (appliedCat !== 'All' ? appliedCat.toUpperCase() : 'GENERAL');

      return (
        <View style={styles.cardContent}>
          <NameCardBackground width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFillObject} gradEnd={gradEnd} strokeColor={strokeColor} />

          {/* Category badge */}
          <View style={[styles.categoryPill, { backgroundColor: badgeBg }]}>
            <Ionicons name={badgeIcon} size={rs(13)} color={badgeTextColor} style={{ marginRight: rs(4) }} />
            <Text style={[styles.categoryPillText, { color: badgeTextColor }]}>{displayCat}</Text>
          </View>

          <View style={[styles.cardTextArea, { justifyContent: 'center', height: CARD_H - hs(80) }]}>
            <Ionicons name="checkmark-done-circle" size={rs(50)} color="#00ADC1" style={{ marginBottom: hs(12) }} />
            <Text style={[styles.trans, { color: isDark ? '#E8EDF2' : '#1A1A1A', fontSize: rs(20) }]}>All Caught Up!</Text>
            <Text style={[styles.meaning, { color: isDark ? '#B0BEC5' : '#555555', marginTop: hs(4), paddingHorizontal: rs(20), lineHeight: hs(18), marginBottom: hs(16) }]}>
              You have viewed all {filteredNames.length} names in this list.
            </Text>

            <View style={{ flexDirection: 'row', gap: rs(14), width: '100%', justifyContent: 'center', marginTop: hs(4) }}>
              <TouchableOpacity
                style={[
                  styles.caughtUpSquareBtn,
                  {
                    backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
                  }
                ]}
                onPress={() => setFilterVisible(true)}
              >
                <Ionicons name="options-outline" size={rs(22)} color={isDark ? '#E8EDF2' : '#1A1A1A'} style={{ marginBottom: hs(4) }} />
                <Text style={[styles.caughtUpSquareBtnTitle, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>Category</Text>
                <Text style={[styles.caughtUpSquareBtnSub, { color: isDark ? '#A0AEC0' : '#666666' }]}>Change Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.caughtUpSquareBtn,
                  {
                    backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
                  }
                ]}
                onPress={() => {
                  setAppliedCat('All');
                  setAppliedStatus('All');
                  setAppliedNumber('');
                  setTempCat('All');
                  setTempStatus('All');
                  setTempNumber('');
                  setActiveIndex(0);
                  activeIndexRef.current = 0;
                  pendingReset.current = true;
                }}
              >
                <Ionicons name="list-outline" size={rs(22)} color={isDark ? '#E8EDF2' : '#1A1A1A'} style={{ marginBottom: hs(4) }} />
                <Text style={[styles.caughtUpSquareBtnTitle, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>99 Names</Text>
                <Text style={[styles.caughtUpSquareBtnSub, { color: isDark ? '#A0AEC0' : '#666666' }]}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    const item = filteredNames[index];
    if (!item) return null;

    const isMastered = masteredIds.includes(item.number);
    const isLearned = learnedIds.includes(item.number) && !isMastered;
    const revisits = revisitCounts?.[item.number] || 0;

    let gradEnd = isDark ? '#1A2332' : '#BCECF7';
    let strokeColor = isDark ? '#2A3A50' : '#A0DCE9';
    let accentColor = '#03B7CE';
    let badgeBg = isDark ? '#000000' : '#0B0C0C';
    let badgeIcon = 'checkmark-circle';
    let badgeTextColor = '#4BD5E8';
    let flagSource = require('../../assets/names/flag/normal.png');
    let textureSource = require('../../assets/names/texture/normal.png');
    let bookholderSource = require('../../assets/names/bookHolder/normalHolder.png');

    if (isMastered) {
      gradEnd = isDark ? '#665200' : '#FFF3C0';
      strokeColor = isDark ? '#FFD700' : '#FFD700';
      accentColor = '#FFC107';
      badgeBg = isDark ? '#000000' : '#0B0C0C';
      badgeIcon = 'trophy';
      badgeTextColor = '#FFB300';
      flagSource = require('../../assets/names/flag/master.png');
      textureSource = require('../../assets/names/texture/master.png');
      bookholderSource = require('../../assets/names/bookHolder/masterHolder.png');
    } else if (isLearned) {
      gradEnd = isDark ? '#062f1d' : '#C8F5D0';
      strokeColor = isDark ? '#0F5132' : '#4CAF50';
      accentColor = '#4CAF50';
      badgeBg = isDark ? '#000000' : '#0B0C0C';
      badgeIcon = 'shield-checkmark';
      badgeTextColor = '#00C853';
      flagSource = require('../../assets/names/flag/learn.png');
      textureSource = require('../../assets/names/texture/learn.png');
      bookholderSource = require('../../assets/names/bookHolder/learnHolder.png');
    }

    const catId = item.category ? item.category.toLowerCase() : '';
    const catObj = categories && categories[catId] ? categories[catId] : null;
    const category = catObj ? catObj.name : (item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General');

    return (
      <View style={styles.cardContent}>
        <NameCardBackground width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFillObject} gradEnd={gradEnd} strokeColor={strokeColor} />

        {/* Texture corners */}
        <View style={styles.textureWrapper}>
          <Image source={textureSource} style={styles.leftTexture} resizeMode="contain" />
          <Image source={textureSource} style={styles.rightTexture} resizeMode="contain" />
        </View>

        {/* Flag */}
        <View style={styles.bookmarkRibbon}>
          <Image source={flagSource} style={styles.flagImage} resizeMode="contain" />
          <View style={styles.bookmarkTextOverlay}>
            <Text style={styles.ribbonText}>{String(item.number).padStart(2, '0')}</Text>
          </View>
        </View>

        {/* Category + status badge */}
        <View style={[styles.categoryPill, { backgroundColor: badgeBg }]}>
          {badgeIcon && <Ionicons name={badgeIcon} size={rs(13)} color={badgeTextColor} style={{ marginRight: rs(4) }} />}
          <Text style={[styles.categoryPillText, { color: badgeTextColor }]}>{category.toUpperCase()}</Text>
        </View>

        {/* Centered text */}
        <View style={styles.cardTextArea}>
          <Text style={[styles.arabic, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>{item.arabic}</Text>
          <Text style={[styles.trans, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>{item.transliteration}</Text>
          <Text style={[styles.meaning, { color: isDark ? '#B0BEC5' : '#555555' }]}>{item.meaning}</Text>
        </View>

        {/* Book holder */}
        <View style={styles.bookholderWrapper}>
          <Image source={bookholderSource} style={styles.bookholderImage} resizeMode="contain" />
        </View>

        {/* Read count indicator — only shown after at least one completion */}
        {revisits > 0 && (
          <View style={styles.readCountRow}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[styles.readDot, i < revisits ? styles.readDotFilled : styles.readDotEmpty]}
              />
            ))}
            <Text style={styles.readCountLabel}>
              {revisits === 1 ? '2nd read' : revisits === 2 ? 'Final read' : 'Mastered'}
            </Text>
          </View>
        )}

        {/* Get Started button */}
        <View style={[styles.getStartedRow, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <Text style={[styles.getStartedText, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>Get Started</Text>
          <View style={[styles.getStartedArrow, { backgroundColor: accentColor }]}>
            <Ionicons name="arrow-forward" size={rs(14)} color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const count = filteredNames.length || 1;
  const totalSlots = isFilteredRef.current ? count + 1 : count;

  const prevIdx = (isFilteredRef.current || activeIndex === 0)
    ? (activeIndex - 1 >= 0 ? activeIndex - 1 : -1)
    : (activeIndex - 1 + count) % count;

  const nextIdx = isFilteredRef.current
    ? (activeIndex + 1 < totalSlots ? activeIndex + 1 : -1)
    : (activeIndex + 1) % count;

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
              {/* ── HEADER ROW ── */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerTitleRow}>
                    <Text style={[styles.headerTitleText, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>Beautiful Names of Allah</Text>
                  </View>
                  <Text style={[styles.headerSubtitleText, { color: isDark ? '#9EAAB8' : '#64748B' }]}>Learn  Reflect  Live By</Text>
                </View>
                <TouchableOpacity
                  style={[styles.headerBookBtn, { backgroundColor: isDark ? 'rgba(0,173,193,0.15)' : '#E0F7FA' }]}
                  onPress={() => setFilterVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="list-outline" size={rs(16)} color="#00ADC1" />
                </TouchableOpacity>
              </View>

              {/* ── PROGRESS CARD ── */}
              <LinearGradient
                colors={isDark ? ['#0F2027', '#1A3A4A'] : ['#F8FDFE', '#E1F8FA']}
                start={{ x: 0, y: 1 }}
                end={{ x: 2.5, y: 0 }}
                style={[styles.progressCard, { shadowColor: isDark ? '#000' : '#B2EBF2' }]}
              >
                {/* Bottom-left stars */}
                <View style={{ position: 'absolute', left: 0, bottom: 0, width: rs(60), height: hs(60), opacity: 0.5 }} pointerEvents="none">
                  <Svg width="100%" height="100%" viewBox="0 0 60 60">
                    <Path d="M 20 28 Q 20 40 32 40 Q 20 40 20 52 Q 20 40 8 40 Q 20 40 20 28 Z" fill={isDark ? 'rgba(0,220,255,0.15)' : 'rgba(0,178,190,0.06)'} />
                    <Path d="M 45 42 Q 45 48 51 48 Q 45 48 45 54 Q 45 48 39 48 Q 45 48 45 42 Z" fill={isDark ? 'rgba(0,220,255,0.1)' : 'rgba(0,178,190,0.04)'} />
                  </Svg>
                </View>

                {/* Right side waves and stars */}
                <View style={{ position: 'absolute', right: rs(-10), top: 0, bottom: 0, width: rs(160), opacity: 0.2 }} pointerEvents="none">
                  {/* Outer stroked wave (slowest) */}
                  <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, {
                    transform: [
                      { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-2)] }) },
                      { translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, hs(1)] }) }
                    ]
                  }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 160 150" preserveAspectRatio="none">
                      <Path d="M 20 150 C 20 110 50 100 70 80 C 90 60 100 40 125 30 C 145 22 155 10 160 0" stroke={isDark ? 'rgba(0,220,255,0.2)' : 'rgba(0,178,190,0.15)'} strokeWidth="3" fill="none" />
                    </Svg>
                  </Animated.View>

                  {/* Middle stroked wave (medium) */}
                  <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, {
                    transform: [
                      { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-5)] }) },
                      { translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, hs(-2)] }) }
                    ]
                  }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 160 150" preserveAspectRatio="none">
                      <Path d="M 45 150 C 45 120 70 110 85 95 C 100 80 115 65 135 55 C 150 48 158 35 160 25" stroke={isDark ? 'rgba(0,220,255,0.15)' : 'rgba(0,178,190,0.1)'} strokeWidth="3" fill="none" />
                    </Svg>
                  </Animated.View>

                  {/* Inner filled wave (fastest & stretches) */}
                  <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, {
                    transform: [
                      { scaleX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
                      { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-8)] }) }
                    ]
                  }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 160 150" preserveAspectRatio="none">
                      <Defs>
                        <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={isDark ? '#00DCFF' : '#00B2BE'} stopOpacity={isDark ? "0.15" : "0.12"} />
                          <Stop offset="1" stopColor={isDark ? '#00DCFF' : '#00B2BE'} stopOpacity={isDark ? "0.05" : "0.03"} />
                        </SvgLinearGradient>
                      </Defs>
                      <Path d="M 70 150 C 70 130 90 120 105 105 C 120 90 130 80 145 75 C 155 71 160 60 160 55 L 160 150 Z" fill="url(#waveGrad)" />
                    </Svg>
                  </Animated.View>

                  {/* Stars (twinkling) */}
                  <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, {
                    opacity: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                    transform: [
                      { scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
                    ]
                  }]}>
                    <Svg width="100%" height="100%" viewBox="0 0 160 150" preserveAspectRatio="none">
                      <Path d="M 115 20 Q 115 35 130 35 Q 115 35 115 50 Q 115 35 100 35 Q 115 35 115 20 Z" fill={isDark ? 'rgba(0,220,255,0.4)' : 'rgba(0,178,190,0.2)'} />
                      <Path d="M 145 10 Q 145 20 155 20 Q 145 20 145 30 Q 145 20 135 20 Q 145 20 145 10 Z" fill={isDark ? 'rgba(0,220,255,0.3)' : 'rgba(0,178,190,0.15)'} />
                      <Path d="M 135 45 Q 135 50 140 50 Q 135 50 135 55 Q 135 50 130 50 Q 135 50 135 45 Z" fill={isDark ? 'rgba(0,220,255,0.2)' : 'rgba(0,178,190,0.1)'} />
                      <Path d="M 155 35 Q 155 38 158 38 Q 155 38 155 41 Q 155 38 152 38 Q 155 38 155 35 Z" fill={isDark ? 'rgba(0,220,255,0.15)' : 'rgba(0,178,190,0.08)'} />
                    </Svg>
                  </Animated.View>
                </View>

                <View style={styles.progressCardInner}>
                  {/* Book icon */}
                  <View style={[styles.progressBookIcon, { backgroundColor: isDark ? 'rgba(0,178,190,0.22)' : '#E4F7FA' }]}>
                    <Ionicons name="book-outline" size={rs(18)} color="#00B2BE" />
                  </View>

                  {/* Stats */}
                  <View style={styles.progressCardRight}>
                    <Text style={[styles.progressCardLabel, { color: isDark ? '#94A3B8' : '#6B8097' }]}>Your Progress</Text>
                    <View style={styles.progressStatsRow}>
                      <View style={styles.progressStatItem}>
                        <Text style={[styles.progressStatValue, { color: isDark ? '#00E5FF' : '#00B2BE' }]}>{learnedIds.length}</Text>
                        <Text style={[styles.progressStatSub, { color: isDark ? '#94A3B8' : '#6B8097' }]}>Names Learned</Text>
                      </View>
                      <View style={[styles.progressStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#D6DFE7' }]} />
                      <View style={styles.progressStatItem}>
                        <Text style={[styles.progressStatValue, { color: isDark ? '#00E5FF' : '#00B2BE' }]}>{formattedReadingTime}</Text>
                        <Text style={[styles.progressStatSub, { color: isDark ? '#94A3B8' : '#6B8097' }]}>Total Learning Time</Text>
                      </View>
                      {/* Clock icon standalone */}
                      <View style={[styles.progressClockCircle, { backgroundColor: isDark ? 'rgba(0,178,190,0.18)' : '#E4F7FA' }]}>
                        <Ionicons name="time-outline" size={rs(16)} color="#246991ff" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Motivation pill */}
                <View
                  style={[styles.motivationPill, { backgroundColor: isDark ? 'rgba(0,178,190,0.08)' : '#EAF8FA' }]}
                >
                  <Text style={[styles.motivationText, { color: isDark ? '#00E5FF' : '#0eb1c0ff' }]}>Keep learning, you're doing great! </Text>
                </View>
              </LinearGradient>

              {/* ── ACTION CARDS ROW ── */}
              <View style={styles.actionCardsRow}>

                {/* FAVORITES */}
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: isDark ? '#0F2027' : '#F8FDFE', shadowColor: isDark ? '#000' : '#B2EBF2', overflow: 'hidden' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('NamesList', { statusFilter: 'favorites' })}
                >
                  <LinearGradient
                    colors={isDark ? ['#0F2027', '#1A3A4A'] : ['#F8FDFE', '#E1F8FA']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 2.5, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {/* Decorative bg icon
                  <Animated.View style={[styles.actionCardDecorFav, {
                    transform: [
                      { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-12)] }) },
                      { translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-4)] }) }
                    ]
                  }]} pointerEvents="none">
                    <Ionicons name="heart" size={rs(52)} color="rgba(244,63,94,0.09)" />
                  </Animated.View> */}

                  <Ionicons name="heart-outline" size={rs(24)} color="#F43F5E" />

                  <View style={styles.actionCardText}>
                    <Text style={[styles.actionCardTitle, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>Favorites</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={rs(16)} color="#F43F5E" />
                </TouchableOpacity>

                {/* DRAFTS */}
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: isDark ? '#0F2027' : '#F8FDFE', shadowColor: isDark ? '#000' : '#B2EBF2', overflow: 'hidden' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('NamesList', { statusFilter: 'drafts' })}
                >
                  <LinearGradient
                    colors={isDark ? ['#0F2027', '#1A3A4A'] : ['#F8FDFE', '#E1F8FA']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 2.5, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {/* Decorative bg icon */}
                  {/* <Animated.View style={[styles.actionCardDecorDraft, {
                    transform: [
                      { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-12)] }) },
                      { translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, rs(-4)] }) }
                    ]
                  }]} pointerEvents="none">
                    <Ionicons name="document-text" size={rs(52)} color="rgba(139,92,246,0.09)" />
                  </Animated.View> */}

                  <Ionicons name="document-text-outline" size={rs(24)} color="#8B5CF6" />

                  <View style={styles.actionCardText}>
                    <Text style={[styles.actionCardTitle, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>Drafts</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={rs(16)} color="#8B5CF6" />
                </TouchableOpacity>

              </View>

              {/* ── LEGEND ROW ── */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
                  <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Mastered</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Learned</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#03B7CE' }]} />
                  <Text style={[styles.legendText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Unlearned</Text>
                </View>
              </View>
            </View>

            {/* ── CARD STACK ENGINE ── */}
            <View style={styles.stackEngine} {...panResponder.panHandlers}>

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
                        <NameCardBackground
                          width={config.width}
                          height={config.height}
                          style={StyleSheet.absoluteFillObject}
                          gradEnd={isDark ? '#1A2332' : '#BCECF7'}
                          strokeColor={isDark ? '#2A3A50' : '#A0DCE9'}
                        />
                      </Animated.View>
                    );
                  })}

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
                        onPress={async () => {
                          if (isAnimating.current) return;
                          const item = filteredNames[dataIdx];
                          if (!item) return;

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

                          AsyncStorage.setItem('last_viewed_name', String(item.number)).catch(() => { });
                          markAsViewed(item.number);

                          let extraParams = { initialStepIndex: 0 };
                          try {
                            const saved = await AsyncStorage.getItem(`draft_progress_${item.number}`);
                            if (saved) {
                              extraParams.draftProgress = JSON.parse(saved);
                              extraParams.initialStepIndex = extraParams.draftProgress.stepIndex || 0;
                            }
                          } catch (e) { }

                          navigation.navigate('NameDetail', {
                            name: item,
                            ...extraParams,
                          });
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

            </View>

            {/* ── FILTER BOTTOM SHEET ── */}
            <Modal
              visible={filterVisible}
              animationType="none"
              transparent
              statusBarTranslucent
              onRequestClose={() => {
                Animated.timing(sheetAnim, {
                  toValue: BS_HIDDEN, duration: 280,
                  easing: Easing.out(Easing.ease), useNativeDriver: false,
                }).start(() => { setFilterVisible(false); sheetStateRef.current = 'hidden'; });
              }}
            >
              {/* Animated backdrop — tap outside sheet to dismiss */}
              <Animated.View
                pointerEvents="box-none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: sheetAnim.interpolate({
                      inputRange: [BS_EXPANDED, BS_PEEK, BS_HIDDEN],
                      outputRange: ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => {
                    Animated.timing(sheetAnim, {
                      toValue: BS_HIDDEN, duration: 280,
                      easing: Easing.out(Easing.ease), useNativeDriver: false,
                    }).start(() => { setFilterVisible(false); sheetStateRef.current = 'hidden'; });
                  }}
                />
              </Animated.View>

              {/* Sheet panel — 'top' is animated so bottom:0 always anchors Apply to screen edge */}
              <Animated.View
                style={[styles.bsSheet, { top: sheetAnim }]}
                {...sheetPanResponder.panHandlers}
              >
                {/* Drag handle */}
                <View style={styles.bsHandleArea}>
                  <View style={styles.bsHandle} />
                </View>

                {/* Sticky header */}
                <View style={styles.bsHeader}>
                  <Text style={styles.bsTitle}>Filter & Sort</Text>
                </View>

                {/* Filter content — plain View so horizontal ScrollViews get all gestures */}
                <View style={styles.bsContent}>
                  <Text style={styles.filterSectionTitle}>CATEGORY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bsChipRow}>
                    {['All', ...(categories ? Object.keys(categories) : [])].map(catId => {
                      const isActive = tempCat === catId;
                      const label = catId === 'All' ? 'All Categories' : categories[catId]?.name || catId;
                      return (
                        <TouchableOpacity
                          key={catId}
                          onPress={() => setTempCat(catId)}
                          style={[styles.filterPill, isActive && styles.filterPillActive, { flexDirection: 'row', alignItems: 'center' }]}
                        >
                          {catId === 'All' && (
                            <Ionicons name="grid-outline" size={rs(16)} color={isActive ? '#00ADC1' : '#1A1A1A'} style={{ marginRight: rs(6) }} />
                          )}
                          <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.filterSectionTitle, { marginTop: hs(20) }]}>STATUS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bsChipRow}>
                    {['All', 'Learned', 'Mastered', 'Remaining'].map(status => {
                      const isActive = tempStatus === status;
                      let dotColor = '#00ADC1';
                      if (status === 'Learned') dotColor = '#4CAF50';
                      if (status === 'Mastered') dotColor = '#FFC107';
                      if (status === 'Remaining') dotColor = '#007BFF';
                      return (
                        <TouchableOpacity
                          key={status}
                          onPress={() => setTempStatus(status)}
                          style={[styles.filterPill, isActive && styles.filterPillActive, { flexDirection: 'row', alignItems: 'center' }]}
                        >
                          <View style={{ width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: dotColor, marginRight: rs(8) }} />
                          <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{status}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Sticky Apply button */}
                <View style={styles.bsApplyArea}>
                  <TouchableOpacity
                    style={styles.applyFilterBtn}
                    onPress={() => {
                      setAppliedCat(tempCat);
                      setAppliedStatus(tempStatus);
                      setAppliedNumber(tempNumber);
                      setActiveIndex(0);
                      activeIndexRef.current = 0;
                      pendingReset.current = true;
                      Animated.timing(sheetAnim, {
                        toValue: BS_HIDDEN, duration: 280,
                        easing: Easing.out(Easing.ease), useNativeDriver: false,
                      }).start(() => { setFilterVisible(false); sheetStateRef.current = 'hidden'; });
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                      <Ionicons name="options-outline" size={rs(18)} color="#FFFFFF" style={{ marginLeft: rs(8) }} />
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </Modal>
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topSection: { paddingTop: hs(14), paddingHorizontal: rs(20), zIndex: 30 },

  // ── NEW HEADER ROW ──
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: hs(14) },
  headerLeft: { flex: 1, paddingRight: rs(12) },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  headerTitleText: {
    fontFamily: FONTS.serif || FONTS.bold,
    fontSize: rs(22),
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSparkles: { fontSize: rs(13), color: '#00ADC1', marginLeft: rs(2) },
  headerSubtitleText: { fontSize: rs(13), marginTop: hs(3), color: '#64748B', letterSpacing: 0.4 },
  headerBookBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00ADC1', shadowOpacity: 0.18, shadowRadius: rs(8), shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // ── PROGRESS CARD ──
  progressCard: {
    borderRadius: rs(18),
    padding: rs(14),
    paddingBottom: rs(12),
    marginBottom: hs(10),
    overflow: 'hidden',
    shadowOpacity: 0.18, shadowRadius: rs(16), shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  progressSparkles: { position: 'absolute', top: hs(8), right: rs(14), flexDirection: 'row', alignItems: 'flex-start', zIndex: 2 },
  sparkleText: { fontWeight: '700' },
  progressWave: { position: 'absolute', right: rs(-6), top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  progressCardInner: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(12), zIndex: 3 },
  progressBookIcon: {
    width: rs(38), height: rs(38), borderRadius: rs(18),
    justifyContent: 'center', alignItems: 'center', marginRight: rs(12), marginBottom: hs(25)
  },
  progressCardRight: { flex: 1 },
  progressCardLabel: { fontSize: rs(11), fontWeight: '500', marginBottom: hs(6) },
  progressStatsRow: { flexDirection: 'row', alignItems: 'center' },
  progressStatItem: { flex: 1 },
  progressClockCircle: {
    width: rs(30), height: rs(30), borderRadius: rs(15), right: rs(10),
    justifyContent: 'center', alignItems: 'center',
    marginLeft: rs(3),
  },
  progressStatValue: { fontSize: rs(24), fontWeight: '700', lineHeight: rs(28) },
  progressStatSub: { fontSize: rs(10), fontWeight: '500', marginTop: hs(1) },
  progressStatDivider: { width: 1, height: hs(30), marginHorizontal: rs(12) },
  progressTimeRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  progressTimeIcon: { width: rs(24), height: rs(24), borderRadius: rs(12), justifyContent: 'center', alignItems: 'center' },
  motivationPill: {
    borderRadius: rs(30),
    paddingVertical: hs(6),
    paddingHorizontal: rs(14),
    alignItems: 'center',
    alignSelf: 'center',
  },
  motivationText: { fontSize: rs(11), fontWeight: '500' },

  // ── ACTION CARDS ROW ──
  actionCardsRow: { flexDirection: 'row', gap: rs(10), marginBottom: hs(10) },
  actionCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: rs(14), paddingVertical: rs(10), paddingHorizontal: rs(10),
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: rs(6), shadowOffset: { width: 0, height: 2 },
    elevation: 3, gap: rs(8),
  },
  actionCardIconBg: { width: rs(34), height: rs(34), borderRadius: rs(17), justifyContent: 'center', alignItems: 'center' },
  actionCardText: { flex: 1 },
  actionCardTitle: { fontSize: rs(13), fontWeight: '700' },
  actionCardSub: { fontSize: rs(10), fontWeight: '400', lineHeight: hs(14), color: '#9E9E9E' },
  actionCardChevron: { width: rs(24), height: rs(24), borderRadius: rs(12), justifyContent: 'center', alignItems: 'center' },
  actionCardDecorFav: { position: 'absolute', bottom: hs(-14), right: rs(-10), zIndex: 0 },
  actionCardDecorDraft: { position: 'absolute', bottom: hs(-14), right: rs(-10), zIndex: 0 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: hs(10), marginTop: hs(4) },
  searchPill: { flex: 1, height: rs(38), backgroundColor: '#FFFFFF', borderRadius: rs(19), flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), gap: rs(8), elevation: 2 },
  searchInput: { flex: 1, fontSize: rs(13), color: '#1A1A1A', paddingVertical: 0, height: rs(38) },
  filterCircle: { width: rs(38), height: rs(38), backgroundColor: '#FFFFFF', borderRadius: rs(19), justifyContent: 'center', alignItems: 'center', elevation: 2 },

  stackEngine: { flex: 1, alignItems: 'center', position: 'relative', overflow: 'hidden' },

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

  cardContent: { flex: 1, top: rs(-45) },
  textureWrapper: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: rs(16) },
  leftTexture: { position: 'absolute', bottom: -150, left: -150, width: rs(250), height: hs(250) },
  rightTexture: { position: 'absolute', bottom: -150, right: -150, width: rs(250), height: hs(250), transform: [{ scaleX: -1 }] },

  cardTextArea: { position: 'absolute', top: hs(38), left: 0, right: 0, alignItems: 'center', paddingHorizontal: rs(20) },
  arabic: { fontSize: rs(13), fontFamily: FONTS.arabic, textAlign: 'center', color: '#1A1A1A', marginBottom: hs(2) },
  trans: { fontSize: rs(28), fontWeight: '700', textAlign: 'center', color: '#1A1A1A', marginBottom: hs(2) },
  meaning: { fontSize: rs(13), fontWeight: '500', textAlign: 'center', color: '#555555' },

  bookmarkRibbon: { position: 'absolute', top: hs(-5), left: rs(15), width: rs(50), height: hs(66), zIndex: 10 },
  flagImage: { width: '100%', height: '100%' },
  bookmarkTextOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingBottom: hs(8) },
  ribbonText: { color: '#FFF', fontSize: rs(16), fontWeight: '700', fontStyle: 'italic' },

  categoryPill: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), paddingVertical: hs(8), borderTopLeftRadius: 0, borderTopRightRadius: rs(16), borderBottomLeftRadius: rs(20), borderBottomRightRadius: 0, zIndex: 10 },
  categoryPillText: { color: '#FFFFFF', fontSize: rs(12), fontWeight: '700', letterSpacing: 1 },

  bookholderWrapper: { position: 'absolute', bottom: hs(50), left: 0, right: 0, alignItems: 'center' },
  bookholderImage: { width: rs(170), height: hs(155) },

  readCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), position: 'absolute', bottom: hs(-14), alignSelf: 'center' },
  readDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  readDotFilled: { backgroundColor: '#03B7CE' },
  readDotEmpty: { backgroundColor: 'rgba(3,183,206,0.2)', borderWidth: 1, borderColor: 'rgba(3,183,206,0.4)' },
  readCountLabel: { fontSize: rs(11), fontWeight: '700', color: '#03B7CE', letterSpacing: 0.4 },

  getStartedRow: { position: 'absolute', bottom: hs(-40), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: rs(10), paddingVertical: hs(10), paddingLeft: rs(24), paddingRight: rs(8), gap: rs(14), shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: rs(8), shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  getStartedText: { fontSize: rs(14), fontWeight: '600', color: '#1A1A1A' },
  getStartedArrow: { width: rs(30), height: rs(30), borderRadius: rs(15), justifyContent: 'center', alignItems: 'center' },

  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', height: hs(180), zIndex: 5 },
  peekFrame: { position: 'absolute', alignSelf: 'center' },


  // ── BOTTOM SHEET ──
  bsSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    // NO height — sheet fills from animated 'top' down to bottom:0 (screen edge).
    // This guarantees the Apply button is always pinned to the screen bottom.
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    elevation: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: rs(12),
  },
  bsHandleArea: { alignItems: 'center', paddingTop: hs(12), paddingBottom: hs(8) },
  bsHandle: { width: rs(40), height: hs(4), backgroundColor: '#E0E0E0', borderRadius: rs(2) },
  bsHeader: {
    paddingHorizontal: rs(24), paddingBottom: hs(14),
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  bsTitle: { fontSize: rs(18), fontWeight: '700', color: '#1A1A1A' },
  bsContent: { paddingHorizontal: rs(24), paddingTop: hs(8), paddingBottom: hs(8) },
  bsChipRow: { flexDirection: 'row', gap: rs(10), paddingBottom: hs(4), paddingRight: rs(24) },
  bsApplyArea: {
    paddingHorizontal: rs(24), paddingVertical: hs(16),
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },

  filterSectionTitle: { fontSize: rs(12), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(10), letterSpacing: 0.5 },

  filterPill: { paddingHorizontal: rs(16), paddingVertical: hs(9), backgroundColor: '#FFFFFF', borderRadius: rs(20), borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#E0F6F9', borderColor: '#00ADC1' },
  filterPillText: { fontSize: rs(13), color: '#1A1A1A', fontWeight: '500' },
  filterPillTextActive: { color: '#00ADC1' },

  applyFilterBtn: { width: '100%', backgroundColor: '#00ADC1', borderRadius: rs(12), paddingVertical: hs(16), alignItems: 'center' },
  applyFilterBtnText: { color: '#FFFFFF', fontSize: rs(16), fontWeight: '700' },

  // ── LEGACY (kept for filter sheet compatibility) ──
  dashboardCard: { width: SW - rs(40), borderRadius: rs(16), borderWidth: 1, padding: rs(16), marginBottom: hs(12) },
  dashboardStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(16) },
  dashboardStatCol: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statIconWrap: { width: rs(36), height: rs(36), borderRadius: rs(18), justifyContent: 'center', alignItems: 'center', marginRight: rs(10) },
  statTextWrap: { justifyContent: 'center' },
  statValue: { fontSize: rs(16), fontWeight: '700', marginBottom: hs(2) },
  statLabel: { fontSize: rs(10), fontWeight: '500' },
  dashboardStatDivider: { width: 1, height: '80%', backgroundColor: 'rgba(150,150,150,0.2)' },
  dashboardProgressWrap: { width: '100%', alignItems: 'center' },
  progressBarBg: { width: '100%', height: hs(6), borderRadius: rs(3), overflow: 'hidden', marginBottom: hs(8) },
  progressBarFill: { height: '100%', borderRadius: rs(3) },
  progressTextRow: { flexDirection: 'row', width: '100%', justifyContent: 'center' },
  progressTextValue: { fontSize: rs(11), fontWeight: '700', letterSpacing: 0.5 },
  actionButtonsRow: { flexDirection: 'row', gap: rs(8), width: SW - rs(40), marginBottom: hs(12) },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hs(12), paddingHorizontal: rs(4), borderRadius: rs(12), borderWidth: 1 },
  actionBtnText: { fontSize: rs(12), fontWeight: '600', marginLeft: rs(6) },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(40), marginVertical: hs(5), marginBottom: hs(15) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  legendDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  legendText: { fontSize: rs(11), fontWeight: '500' },

  // ── CAUGHT UP CARD BUTTONS ──
  caughtUpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hs(10), borderRadius: rs(10), borderWidth: 1, gap: rs(8) },
  caughtUpBtnText: { fontSize: rs(13), fontWeight: '600' },
  caughtUpSquareBtn: {
    width: rs(115),
    height: hs(88),
    borderRadius: rs(14),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(8),
  },
  caughtUpSquareBtnTitle: {
    fontSize: rs(13),
    fontWeight: '700',
  },
  caughtUpSquareBtnSub: {
    fontSize: rs(10),
    fontWeight: '500',
    marginTop: hs(2),
  },

});

export default NamesScreen;
