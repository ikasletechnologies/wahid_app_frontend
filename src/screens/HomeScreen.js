import React, { useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, StatusBar, RefreshControl, Image,
  Animated, Easing, Share, Alert, Modal,
} from 'react-native';
import Text from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useFontSettings } from '../context/FontSettingsContext';
import http from '../config/http';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');
const rs = (n) => Math.round(n * (SW / 393));

const getRelativeTime = (timestamp) => {
  if (!timestamp) return null;
  const now = Date.now();
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  }

  // Calculate if it was yesterday
  const today = new Date(now);
  const targetDate = new Date(timestamp);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Older -> Date formatted manually (e.g. Aug 20)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(timestamp);
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { scaleFontSize } = useFontSettings();
  const { names, learnedIds, masteredIds, refresh, refreshing, draftIds, markAsDraft, removeDraft, checkCardAccess, fetchSubscriptionStatus, isSubscribed } = useNames();
  const { favouriteIds } = usePlaylist();

  // ── State ──────────────────────────────────────────────────────────────────
  const [lastReadName, setLastReadName] = React.useState(null);
  const [isNewName, setIsNewName] = React.useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState(null);
  const [timeAgo, setTimeAgo] = React.useState(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [suggestedNames, setSuggestedNames] = React.useState([]);
  const [suggestedOffset, setSuggestedOffset] = React.useState(0);
  const [draftLimitModalVisible, setDraftLimitModalVisible] = React.useState(false);
  const [pendingDraft, setPendingDraft] = React.useState(null);
  const [progressMap, setProgressMap] = React.useState({});
  const lastNotifFetchRef = React.useRef(0);

  React.useEffect(() => {
    if (!lastReadTimestamp) {
      setTimeAgo(null);
      return;
    }
    const update = () => {
      setTimeAgo(getRelativeTime(lastReadTimestamp));
    };
    update();
    const interval = setInterval(update, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [lastReadTimestamp]);

  // ── Floating book animation ────────────────────────────────────────────────
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      if (fetchSubscriptionStatus) fetchSubscriptionStatus();
      const now = Date.now();
      if (now - lastNotifFetchRef.current < 30_000) return;
      lastNotifFetchRef.current = now;
      http.get('/api/notifications')
        .then(res => { if (res.data?.success) setUnreadNotifications(res.data.data.unreadCount || 0); })
        .catch(() => { });
    }, [fetchSubscriptionStatus])
  );

  // ── Last read name ─────────────────────────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      if (!names || names.length === 0) return;
      const pickRemaining = () => {
        const remaining = names.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
        if (remaining.length > 0) { setLastReadName(remaining[0]); setIsNewName(true); }
        else { setLastReadName(names[0] || null); setIsNewName(false); }
      };

      const activeDrafts = (draftIds || []).filter(id => !learnedIds.includes(id) && !masteredIds.includes(id));

      AsyncStorage.getItem('last_reading_progress')
        .then(saved => {
          if (saved) {
            const progress = JSON.parse(saved);
            const isCompleted = learnedIds.includes(progress.nameNumber) || masteredIds.includes(progress.nameNumber);
            if (!isCompleted) {
              const nameObj = names.find(n => n.number === progress.nameNumber);
              if (nameObj) {
                setLastReadName(nameObj);
                setIsNewName(false);
                setLastReadTimestamp(progress.timestamp || null);
                return;
              }
            } else {
              // The previous in-progress item was completed!
              // Try to automatically promote the next Draft card
              if (activeDrafts.length > 0) {
                const firstDraftId = activeDrafts[0];
                const nameObj = names.find(n => n.number === firstDraftId);
                if (nameObj) {
                  setLastReadName(nameObj);
                  setIsNewName(false);
                  setLastReadTimestamp(null);
                  AsyncStorage.setItem('last_reading_progress', JSON.stringify({
                    nameNumber: firstDraftId,
                    stepIndex: 0,
                    timestamp: null,
                  })).catch(() => { });
                  return;
                }
              }
              AsyncStorage.removeItem('last_reading_progress').catch(() => { });
            }
          }
          pickRemaining(); setLastReadTimestamp(null);
        })
        .catch(() => { pickRemaining(); setLastReadTimestamp(null); });
    }, [names, learnedIds, masteredIds, draftIds])
  );

  // ── Suggested names ────────────────────────────────────────────────────────
  const activeDraftIds = React.useMemo(() => {
    return (draftIds || []).filter(id => !learnedIds.includes(id) && !masteredIds.includes(id));
  }, [draftIds, learnedIds, masteredIds]);

  const isFreshUser = learnedIds.length === 0 && masteredIds.length === 0 && (draftIds || []).length === 0;

  const visibleDraftsCount = React.useMemo(() => {
    let count = activeDraftIds.length;
    if (lastReadName && activeDraftIds.includes(lastReadName.number)) {
      count -= 1;
    }
    return count;
  }, [activeDraftIds, lastReadName]);

  React.useEffect(() => {
    if (!names || names.length === 0) return;

    const unlearned = names.filter(n =>
      !learnedIds.includes(n.number) &&
      !masteredIds.includes(n.number) &&
      !activeDraftIds.includes(n.number)
    );

    const validOffset = unlearned.length > 0 ? suggestedOffset % unlearned.length : 0;
    let nextCards = unlearned.slice(validOffset, validOffset + 3);

    if (nextCards.length < 3 && unlearned.length > 3) {
      nextCards = [...nextCards, ...unlearned.slice(0, 3 - nextCards.length)];
    }

    setSuggestedNames(nextCards);
  }, [names, learnedIds, masteredIds, activeDraftIds, suggestedOffset]);

  const handleRefreshSuggestions = () => {
    setSuggestedOffset(prev => prev + 3);
  };

  // ── Match % ────────────────────────────────────────────────────────────────
  const getMatchPercent = React.useCallback((name, idx = 0) => {
    const known = [...learnedIds, ...masteredIds];
    if (known.length === 0) return Math.max(40, 60 - idx * 10);

    const categoryCounts = {};
    known.forEach(id => {
      const n = names.find(x => x.number === id);
      if (n?.category) categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });

    const sameCategory = categoryCounts[name.category] || 0;
    const pct = Math.round((sameCategory / known.length) * 100);
    return Math.min(95, Math.max(35, pct || 35));
  }, [names, learnedIds, masteredIds]);

  // ── Dynamic Progress Helper ────────────────────────────────────────────────
  const getTotalSteps = React.useCallback((name) => {
    let count = 1; // meaning
    if (name.gifts && name.gifts.length > 0) count++;
    if ((name.quran && name.quran.length > 0) || (name.quranic && name.quranic.length > 0)) count++;
    if ((name.hadith && name.hadith.length > 0) || (name.sunnah && name.sunnah.length > 0)) count++;
    if (name.practicalWays && name.practicalWays.length > 0) count++;
    count++; // reflection or mastery
    return count;
  }, []);

  // ── Draft names ────────────────────────────────────────────────────────────
  const draftNames = useMemo(() => {
    if (!activeDraftIds || !names) return [];
    let filteredDraftIds = activeDraftIds;
    if (lastReadName) {
      filteredDraftIds = activeDraftIds.filter(id => id !== lastReadName.number);
    }
    return filteredDraftIds.slice(0, 4).map(id => names.find(n => n.number === id)).filter(Boolean);
  }, [activeDraftIds, names, lastReadName]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProgress = async () => {
        const ids = new Set([
          ...draftNames.map(n => n.number || n.id),
          ...suggestedNames.map(n => n.number || n.id)
        ].filter(Boolean));
        if (ids.size === 0) return;

        const keys = Array.from(ids).map(id => `draft_progress_${id}`);
        try {
          const results = await AsyncStorage.multiGet(keys);
          const newMap = {};
          results.forEach(([key, value]) => {
            if (value) {
              const id = key.replace('draft_progress_', '');
              const parsed = JSON.parse(value);
              newMap[id] = parsed.stepIndex || 0;
            }
          });
          setProgressMap(newMap);
        } catch (e) { }
      };
      fetchProgress();
    }, [draftNames, suggestedNames])
  );

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = async () => { await refresh(); };

  // ── Greeting & initial ─────────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning!';
    if (h < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  }, []);

  const initial = useMemo(() => (user?.name || 'Wahid').charAt(0).toUpperCase(), [user]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = 99;
    const learned = learnedIds.length;
    const mastered = masteredIds.length;
    return { learned, mastered, progress: total > 0 ? Math.round((learned / total) * 100) : 0 };
  }, [learnedIds, masteredIds]);

  // ── Continue reading ───────────────────────────────────────────────────────
  const handleContinueReading = async () => {
    if (!lastReadName) {
      const def = names.find(n => n.number === 1) || names[0];
      if (def) {
        if (checkCardAccess && !checkCardAccess(def, navigation)) return;
        navigation.navigate('NameDetail', { name: def, initialStepIndex: 0 });
      }
      return;
    }
    if (checkCardAccess && !checkCardAccess(lastReadName, navigation)) return;
    const nameNumber = lastReadName.number || lastReadName.id;
    try {
      const [savedProgress, savedDraft] = await Promise.all([
        AsyncStorage.getItem('last_reading_progress'),
        AsyncStorage.getItem(`draft_progress_${nameNumber}`),
      ]);
      const progress = savedProgress ? JSON.parse(savedProgress) : null;
      const draft = savedDraft ? JSON.parse(savedDraft) : null;
      const initialStepIndex = progress?.nameNumber === nameNumber ? (progress.stepIndex ?? 0) : 0;
      navigation.navigate('NameDetail', { name: lastReadName, initialStepIndex, draftProgress: draft });
    } catch {
      navigation.navigate('NameDetail', { name: lastReadName, initialStepIndex: 0 });
    }
  };

  // ── Color tokens ───────────────────────────────────────────────────────────
  const bg = isDark ? '#0F172A' : '#F0FBFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F0F4F8' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#475569';
  const teal = '#00ADC1';
  const tealLight = isDark ? 'rgba(0,173,193,0.15)' : '#E0F8FA';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EEF0';

  // ── Render helpers ─────────────────────────────────────────────────────────

  const SUGGEST_FALLBACK = [
    { number: -10, arabic: '\u0627\u0644\u0652\u0639\u064e\u062f\u0652\u0644', transliteration: "Al-'Adl", meaning: 'The Just', matchPercent: 60 },
    { number: -11, arabic: '\u0627\u0644\u0652\u063a\u064e\u0641\u064f\u0648\u0631', transliteration: 'Al-Ghafur', meaning: 'The Most Forgiving', matchPercent: 45 },
    { number: -12, arabic: '\u0627\u0644\u0652\u0645\u064e\u0644\u0650\u0643', transliteration: 'Al-Malik', meaning: 'The King', matchPercent: 40 },
  ];

  const renderDraftCard = ({ item }) => {
    const total = getTotalSteps(item);
    const step = progressMap[item.number] || 0;
    const progressPct = total > 0 ? Math.min(100, Math.round((step / total) * 100)) : 0;

    return (
      <TouchableOpacity
        key={item.number}
        style={[styles.draftCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FCFD', borderColor }]}
        activeOpacity={0.8}
        onPress={async () => {
          if (item.number > 0) {
            if (checkCardAccess && !checkCardAccess(item, navigation)) return;
            const now = Date.now();
            const draftStepIndex = progressMap[item.number] || 0;
            await AsyncStorage.setItem('last_reading_progress', JSON.stringify({
              nameNumber: item.number,
              stepIndex: draftStepIndex,
              timestamp: now,
            })).catch(() => { });
            navigation.navigate('NameDetail', { name: item, initialStepIndex: draftStepIndex });
          }
        }}
      >
        <Text style={[styles.draftArabic, { color: teal }]}>{item.arabic || ''}</Text>
        <Text style={[styles.draftTrans, { color: textPrimary }]} numberOfLines={1}>{item.transliteration || ''}</Text>
        <View style={{ width: '100%', height: rs(3), backgroundColor: isDark ? 'rgba(0,173,193,0.2)' : '#E0F8FA', borderRadius: rs(2), marginTop: rs(2), overflow: 'hidden' }}>
          <View style={[styles.draftBar, { width: `${progressPct}%`, backgroundColor: teal, marginTop: 0 }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestRow = (item, idx) => {
    const isDraft = activeDraftIds.includes(item.number);
    const isLearned = learnedIds.includes(item.number) || masteredIds.includes(item.number);
    const showTick = isDraft || isLearned;
    const matchPercent = item.matchPercent ?? getMatchPercent(item, idx);

    return (
      <View key={item.number} style={[styles.suggestRow, { borderBottomColor: borderColor }]}>
        <View style={styles.suggestTextCol}>
          <Text style={[styles.suggestArabic, { color: teal }]}>{item.arabic || ''}</Text>
          <Text style={[styles.suggestTrans, { color: textPrimary }]}>{item.transliteration || ''}</Text>
          <Text style={[styles.suggestMeaning, { color: textSec }]} numberOfLines={1}>{item.shortMeaning || item.meaning || ''}</Text>
        </View>
        <View style={styles.suggestRight}>
          <View style={[styles.matchBadge, { backgroundColor: tealLight }]}>
            <Text style={[styles.matchPercentText, { color: teal }]}>{matchPercent}%</Text>
            <Text style={[styles.matchLabelText, { color: teal }]}>Match</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkBtn, { backgroundColor: showTick ? '#4CAF50' : teal, opacity: isLearned ? 0.7 : 1 }]}
            disabled={isLearned}
            activeOpacity={isLearned ? 1 : 0.8}
            onPress={() => {
              if (isLearned) return;
              if (isDraft) {
                removeDraft(item.number);
              } else {
                if (checkCardAccess && !checkCardAccess(item, navigation)) {
                  return;
                }

                if (visibleDraftsCount === 4) {
                  setPendingDraft(item.number);
                  setDraftLimitModalVisible(true);
                } else {
                  markAsDraft(item.number);
                }
              }
            }}
          >
            <Ionicons
              name={showTick ? 'checkmark' : 'add'}
              size={rs(16)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg, paddingBottom: insets.bottom }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: tealLight }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={[styles.avatarText, { color: teal }]}>{initial}</Text>
          </TouchableOpacity>
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.helloText, { color: textSec }]} numberOfLines={1}>Hello {user?.name || 'Demo User'},</Text>
            <Text style={[styles.greetingText, { color: textPrimary }]} numberOfLines={1}>{greeting}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: cardBg, borderColor }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('NamesList', { statusFilter: 'favorites' })}
          >
            <Ionicons name="heart-outline" size={rs(20)} color={teal} />
            {favouriteIds && favouriteIds.size > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: cardBg, borderColor }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={rs(20)} color={teal} />
            {unreadNotifications > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SCROLL BODY ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom + rs(20), rs(40)) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={teal} colors={[teal]} />
        }
      >

        {/* ── IN PROGRESS CARD ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, paddingBottom: 0 }]}>
          {/* Top row */}
          <View style={[styles.cardHeaderRow, { marginBottom: rs(25) }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: tealLight }]}>
                <Ionicons name="book-outline" size={rs(18)} color={teal} />
              </View>
              <View>
                <Text style={[styles.cardBadgeText, { color: teal }]}>
                  {isFreshUser ? 'NEW' : 'IN PROGRESS'}
                </Text>
                <Text style={[styles.cardSubText, { color: textSec }]}>
                  {isFreshUser ? 'Start Your Journey' : 'Continue your journey'}
                </Text>
              </View>
            </View>
            <View style={[styles.timeBadge, { borderWidth: 1, borderColor: teal, borderRadius: rs(20), paddingHorizontal: timeAgo ? rs(10) : rs(5), paddingVertical: rs(5) }]}>
              <Ionicons name="time-outline" size={rs(12)} color={teal} style={{ fontWeight: '600' }} />
              {!isFreshUser && timeAgo ? <Text style={[styles.timeText, { color: teal }]}>{timeAgo}</Text> : null}
            </View>
          </View>

          {/* Name + book image */}
          <View style={styles.inProgressContent}>
            <View style={styles.inProgressLeft}>
              <View style={styles.inProgressTextGroup}>
                <Text style={[styles.inProgressArabic, { color: teal }]}>{lastReadName?.arabic || 'الأعلى'}</Text>
                <Text style={[styles.inProgressTrans, { color: textPrimary }]}>
                  {lastReadName?.transliteration || "Al-A'lā"}
                </Text>
                <Text style={[styles.inProgressMeaning, { color: textSec }]} numberOfLines={1}>
                  {lastReadName?.shortMeaning || lastReadName?.meaning || 'The Most High'}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={handleContinueReading} style={[styles.continueBtn, { backgroundColor: teal }]}>
                <Text style={styles.continueBtnText}>
                  {isFreshUser ? 'Start Journey' : 'Continue Reading'}
                </Text>
                <View style={[styles.continueBtnIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="arrow-forward" size={rs(14)} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inProgressRight}>
              <Animated.Image
                source={require('../../assets/names/book.png')}
                style={[
                  styles.bookImg,
                  {
                    transform: [
                      { scale: 1.1 },
                      { rotate: '3deg' },
                      { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* ── DRAFT SECTION ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, paddingBottom: rs(16) }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9' }]}>
                <Ionicons name="document-text-outline" size={rs(18)} color={textSec} />
              </View>
              <View>
                <Text style={[styles.cardBadgeText, { color: textPrimary }]}>DRAFT</Text>
                <Text style={[styles.cardSubText, { color: textSec }]}>Your unfinished reads</Text>
              </View>
            </View>
          </View>
          <View style={styles.draftList}>
            {Array.from({ length: 4 }).map((_, i) => {
              if (i < draftNames.length) {
                const item = draftNames[i];
                return renderDraftCard({ item });
              } else {
                const isStartedInProgressActive = lastReadName && lastReadTimestamp;
                const allowedVisibleDrafts = 4 - (isStartedInProgressActive ? 1 : 0);
                const isLocked = i >= allowedVisibleDrafts;

                if (isLocked) {
                  return (
                    <View
                      key={`empty-${i}`}
                      style={[
                        styles.draftCard,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F6F9FA',
                          borderColor: teal,
                          borderStyle: 'dashed',
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: 0.6,
                        }
                      ]}
                    >
                      <Ionicons name="lock-closed-outline" size={rs(16)} color={isDark ? '#94A3B8' : '#94A3B8'} />
                      <Text style={{ fontSize: rs(9), color: isDark ? '#94A3B8' : '#94A3B8', fontFamily: FONTS.medium, marginTop: rs(2) }}>Locked</Text>
                    </View>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      key={`empty-${i}`}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('SuggestedNames')}
                      style={[
                        styles.draftCard,
                        {
                          backgroundColor: isDark ? 'rgba(0,173,193,0.03)' : '#F0FAFB',
                          borderColor: teal,
                          borderStyle: 'dashed',
                          borderWidth: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }
                      ]}
                    >
                      <Ionicons name="add" size={rs(18)} color={teal} />
                      <Text style={{ fontSize: rs(9), color: teal, fontFamily: FONTS.medium, marginTop: rs(2) }}>Add</Text>
                    </TouchableOpacity>
                  );
                }
              }
            })}
          </View>
        </View>

        {/* ── INVITE FRIENDS ── */}
        <View style={[styles.card, styles.inviteCard, {
          backgroundColor: isDark ? '#0B2027' : '#E6F9FA',
          borderColor: isDark ? 'rgba(0,173,193,0.2)' : '#B2E8EE',
        }]}>
          <View style={styles.inviteLeft}>
            <View style={[styles.inviteIconWrap, { backgroundColor: isDark ? 'rgba(0,173,193,0.2)' : '#CCF0F5' }]}>
              <Ionicons name="people" size={rs(22)} color={teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inviteTitle, { color: textPrimary }]} numberOfLines={1}>Invite Friends</Text>
              <Text style={[styles.inviteSub, { color: textSec }]} numberOfLines={1}>Share the blessing of learning</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.inviteNowBtn, { backgroundColor: teal }]}
            activeOpacity={0.8}
            onPress={() => Share.share({ message: 'Join me in learning the 99 Names of Allah on the Wahid App! Download now: https://wahidapp.com' })}
          >
            <Ionicons name="person-add-outline" size={rs(13)} color="#FFFFFF" />
            <Text style={styles.inviteNowText} numberOfLines={1}>Invite Now</Text>
          </TouchableOpacity>
        </View>

        {/* ── SUGGESTED FOR YOU ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.cardHeaderLeft, { flex: 1, marginRight: rs(8) }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardBadgeText, { color: teal }]} numberOfLines={1}>SUGGESTED FOR YOU</Text>
                <Text style={[styles.cardSubText, { color: textSec }]} numberOfLines={1}>Based on your progress</Text>
              </View>
            </View>
            <View style={styles.suggestActions}>
              <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshSuggestions} activeOpacity={0.7}>
                <Ionicons name="refresh" size={rs(16)} color={teal} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Categories')}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: rs(2) }}
              >
                <Text style={[styles.viewAllText, { color: teal }]}>View all</Text>
                <Ionicons name="chevron-forward" size={rs(14)} color={teal} />
              </TouchableOpacity>
            </View>
          </View>

          <View>
            {(suggestedNames.length > 0 ? suggestedNames.slice(0, 3) : SUGGEST_FALLBACK).map((item, idx) =>
              renderSuggestRow(item, idx)
            )}
          </View>

          {/* Footer note */}
          <View style={[styles.draftNote, { borderTopColor: borderColor }]}>
            <Ionicons name="checkmark-circle" size={rs(16)} color={teal} />
            <Text style={[styles.draftNoteText, { color: textSec }]}>
              Selected names will be moved to Drafts
            </Text>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={[styles.dualStatsContainer, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <Svg style={{ position: 'absolute', width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="gradLeft" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={cardBg} stopOpacity="1" />
                <Stop offset="1" stopColor={cardBg} stopOpacity="1" />
              </SvgLinearGradient>
              <SvgLinearGradient id="gradRight" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={isDark ? "#3F3B36" : "#FFFBEA"} stopOpacity="0.9" />
                <Stop offset="0" stopColor={isDark ? "#2E2C31" : "#FFF3C4"} stopOpacity="0.9" />
              </SvgLinearGradient>
            </Defs>
            <Path d="M0,0 L53,0 L47,100 L0,100 Z" fill="url(#gradLeft)" />
            <Path d="M53,0 L100,0 L100,100 L47,100 Z" fill="url(#gradRight)" />
            <Path d="M53,0 L47,100" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="0.5" />
          </Svg>

          {/* Left Panel: Learned */}
          <TouchableOpacity style={styles.dualStatPanel} onPress={() => navigation.navigate('Learned')} activeOpacity={0.8}>
            <View style={styles.dualStatRow}>
              <View style={styles.neonRingGreen}>
                <Ionicons name="book-outline" size={rs(24)} color="#10B981" />
              </View>
              <View style={styles.dualStatTextWrapper}>
                <Text style={styles.dualStatValueGreen}>{stats.learned}</Text>
                <Text style={[styles.dualStatLabelLeft, { color: textPrimary }]}>Learned</Text>
                {/* <View style={styles.dualStatDashGreen} /> */}
                <Text style={[styles.dualStatSubtitleLeft, { color: textSec }]}>Keep learning{"\n"}every day</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Right Panel: Mastered */}
          <TouchableOpacity style={styles.dualStatPanel} onPress={() => navigation.navigate('Mastered')} activeOpacity={0.8}>
            <View style={[styles.dualStatRow, { justifyContent: 'flex-end' }]}>
              <View style={styles.dualStatTextWrapperRight}>
                <Text style={styles.dualStatValueGold}>{stats.mastered}</Text>
                <Text style={[styles.dualStatLabelRight, { color: textPrimary }]}>Mastered</Text>
                {/* <View style={styles.dualStatDashGold} /> */}
                <Text style={[styles.dualStatSubtitleRight, { color: textSec }]}>You're on your{"\n"}way!</Text>
              </View>
              <View style={styles.neonRingGold}>
                <Ionicons name="trophy-outline" size={rs(24)} color="#F59E0B" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Center >> Button */}
          <View style={[styles.centerSlantBtn, { backgroundColor: isDark ? '#0F172A' : '#10B981', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="chevron-forward" size={rs(16)} color="#FFFFFF" style={{ marginLeft: rs(2) }} />
            <Ionicons name="chevron-forward" size={rs(16)} color="#FFFFFF" style={{ marginLeft: rs(-10) }} />
          </View>
        </View>

        <View style={{ height: rs(2) }} />
      </ScrollView>

      {/* --- Custom Modal for Draft Limit --- */}
      <Modal
        transparent
        visible={draftLimitModalVisible}
        animationType="fade"
        onRequestClose={() => setDraftLimitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalText, { color: textPrimary }]}>
              Draft Complete
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: teal }]}
              onPress={() => {
                setDraftLimitModalVisible(false);
                if (pendingDraft) {
                  markAsDraft(pendingDraft);
                  setPendingDraft(null);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    paddingVertical: rs(14),
  },
  headerLeft: { flex: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: rs(12), marginRight: rs(8) },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  avatar: { width: rs(44), height: rs(44), borderRadius: rs(22), justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: FONTS.bold, fontSize: rs(18) },
  helloText: { fontFamily: FONTS.regular, fontSize: rs(12), lineHeight: rs(16) },
  greetingText: { fontFamily: FONTS.bold, fontSize: rs(16), lineHeight: rs(20) },
  bellBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  notifDot: {
    position: 'absolute', top: rs(8), right: rs(8),
    width: rs(8), height: rs(8), borderRadius: rs(4),
    backgroundColor: '#00ADC1', borderWidth: 1.5, borderColor: '#FFFFFF',
  },

  // Scroll
  scroll: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(120) },

  // Card base
  card: {
    borderRadius: rs(16), borderWidth: 1, padding: rs(16), marginBottom: rs(14),
    shadowColor: '#00ADC1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(12) },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(14) },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  cardIconWrap: { width: rs(38), height: rs(38), borderRadius: rs(19), justifyContent: 'center', alignItems: 'center' },
  cardBadgeText: { fontFamily: FONTS.bold, fontSize: rs(14), letterSpacing: 0.6, textTransform: 'uppercase' },
  cardSubText: { fontFamily: FONTS.regular, fontSize: rs(11), marginTop: rs(1) },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
  },
  timeText: { fontFamily: FONTS.bold, fontSize: rs(11) },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(2) },
  viewAllText: { fontFamily: FONTS.medium, fontSize: rs(13) },

  // IN PROGRESS
  inProgressContent: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'visible' },
  inProgressLeft: { flex: 1, paddingRight: rs(4), gap: rs(12), justifyContent: 'space-between' },
  inProgressTextGroup: { gap: rs(0), marginLeft: 10, },
  inProgressArabic: { fontFamily: FONTS.bold, fontSize: rs(14), marginBottom: rs(-2) },
  inProgressTrans: { fontFamily: FONTS.bold, fontSize: rs(20), lineHeight: rs(24) },
  inProgressMeaning: { fontFamily: FONTS.regular, fontSize: rs(12), marginTop: rs(-2) },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: rs(10), paddingHorizontal: rs(14), paddingVertical: rs(10),
    alignSelf: 'flex-start', gap: rs(12),
    shadowColor: '#00ADC1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  continueBtnText: { fontFamily: FONTS.bold, fontSize: rs(13), color: '#FFFFFF' },
  continueBtnIconWrap: {
    width: rs(22), height: rs(22), borderRadius: rs(11),
    justifyContent: 'center', alignItems: 'center',
  },
  inProgressRight: {
    width: rs(120), alignItems: 'center', justifyContent: 'flex-start',
    marginTop: rs(-12), marginBottom: rs(-40), overflow: 'visible',
  },
  bookImg: { width: rs(150), height: rs(185) },

  // DRAFT
  draftList: { flexDirection: 'row', gap: rs(8) },
  draftCard: {
    flex: 1, paddingVertical: rs(10), paddingHorizontal: rs(4),
    borderRadius: rs(12), borderWidth: 1, alignItems: 'center', gap: rs(4),
    minWidth: 0,
  },
  draftArabic: { fontFamily: FONTS.bold, fontSize: rs(13), textAlign: 'center', lineHeight: rs(20) },
  draftTrans: { fontFamily: FONTS.medium, fontSize: rs(10), textAlign: 'center', lineHeight: rs(14) },
  draftBar: { height: '100%', borderRadius: rs(2) },

  // INVITE
  inviteCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(12) },
  inviteLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1, marginRight: rs(10) },
  inviteIconWrap: { width: rs(40), height: rs(40), borderRadius: rs(20), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  inviteTitle: { fontFamily: FONTS.bold, fontSize: rs(13) },
  inviteSub: { fontFamily: FONTS.regular, fontSize: rs(11), marginTop: rs(1) },
  inviteNowBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(20), flexShrink: 0 },
  inviteNowText: { fontFamily: FONTS.bold, fontSize: rs(12), color: '#FFFFFF' },

  // SUGGESTED
  suggestActions: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  refreshText: { fontFamily: FONTS.medium, fontSize: rs(13) },
  suggestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(12), borderBottomWidth: 1, gap: rs(12) },
  suggestTextCol: { flex: 1 },
  suggestArabic: { fontFamily: FONTS.bold, fontSize: rs(13) },
  suggestTrans: { fontFamily: FONTS.bold, fontSize: rs(14), lineHeight: rs(18) },
  suggestMeaning: { fontFamily: FONTS.regular, fontSize: rs(12) },
  suggestRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  matchBadge: { borderRadius: rs(8), paddingHorizontal: rs(10), paddingVertical: rs(5), alignItems: 'center', justifyContent: 'center' },
  matchPercentText: { fontFamily: FONTS.bold, fontSize: rs(13), lineHeight: rs(16) },
  matchLabelText: { fontFamily: FONTS.regular, fontSize: rs(9), lineHeight: rs(11) },
  checkBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), justifyContent: 'center', alignItems: 'center' },
  draftNote: { flexDirection: 'row', alignItems: 'center', gap: rs(6), paddingTop: rs(12), marginTop: rs(4), borderTopWidth: 1 },
  draftNoteText: { fontFamily: FONTS.medium, fontSize: rs(12) },

  // STATS
  dualStatsContainer: {
    height: rs(110),
    borderRadius: rs(20),
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: rs(2),
    marginTop: rs(2),
  },
  dualStatPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: rs(16),
  },
  dualStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neonRingGreen: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  neonRingGold: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    marginLeft: rs(12),
  },
  dualStatTextWrapper: { marginLeft: rs(12), alignItems: 'center' },
  dualStatTextWrapperRight: { alignItems: 'center' },
  dualStatValueGreen: { fontSize: rs(26), fontFamily: FONTS.bold, color: '#10B981', includeFontPadding: false },
  dualStatValueGold: { fontSize: rs(26), fontFamily: FONTS.bold, color: '#F59E0B', includeFontPadding: false },
  dualStatLabelLeft: { fontSize: rs(13), fontFamily: FONTS.bold, marginTop: rs(-2), textAlign: 'center' },
  dualStatLabelRight: { fontSize: rs(13), fontFamily: FONTS.bold, marginTop: rs(-2), textAlign: 'center' },
  dualStatDashGreen: { width: rs(12), height: rs(3), backgroundColor: '#10B981', borderRadius: rs(2), marginTop: rs(2), marginBottom: rs(2) },
  dualStatDashGold: { width: rs(12), height: rs(3), backgroundColor: '#F59E0B', borderRadius: rs(2), marginTop: rs(2), marginBottom: rs(2) },
  dualStatSubtitleLeft: { fontSize: rs(9), fontFamily: FONTS.regular, textAlign: 'center' },
  dualStatSubtitleRight: { fontSize: rs(9), fontFamily: FONTS.regular, textAlign: 'center' },
  centerSlantBtn: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -rs(16) }, { translateY: -rs(16) }],
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  modalContainer: { width: '100%', borderRadius: rs(16), padding: rs(24), borderWidth: 1, alignItems: 'center' },
  modalText: { fontFamily: FONTS.medium, fontSize: rs(15), textAlign: 'center', lineHeight: rs(22), marginBottom: rs(24) },
  modalButton: { paddingVertical: rs(12), paddingHorizontal: rs(32), borderRadius: rs(8), alignItems: 'center', width: '100%' },
  modalButtonText: { fontFamily: FONTS.bold, fontSize: rs(14), color: '#FFFFFF' },
});


export default HomeScreen;
