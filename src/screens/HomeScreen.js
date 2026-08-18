import React, { useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, StatusBar, RefreshControl, Image,
  Animated, Easing, Share, Alert, Modal,
} from 'react-native';
import Text from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useFontSettings } from '../context/FontSettingsContext';
import http from '../config/http';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');
const rs = (n) => Math.round(n * (SW / 393));
// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const { scaleFontSize } = useFontSettings();
  const { names, learnedIds, masteredIds, refresh, refreshing, draftIds, markAsDraft, removeDraft } = useNames();

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [lastReadName, setLastReadName] = React.useState(null);
  const [isNewName, setIsNewName] = React.useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [suggestedNames, setSuggestedNames] = React.useState([]);
  const [suggestedOffset, setSuggestedOffset] = React.useState(0);
  const [draftLimitModalVisible, setDraftLimitModalVisible] = React.useState(false);
  const [progressMap, setProgressMap] = React.useState({});
  const lastNotifFetchRef = React.useRef(0);

  // â”€â”€ Floating book animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (now - lastNotifFetchRef.current < 30_000) return;
      lastNotifFetchRef.current = now;
      http.get('/api/notifications')
        .then(res => { if (res.data?.success) setUnreadNotifications(res.data.data.unreadCount || 0); })
        .catch(() => {});
    }, [])
  );

  // â”€â”€ Last read name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useFocusEffect(
    React.useCallback(() => {
      if (!names || names.length === 0) return;
      const pickRemaining = () => {
        const remaining = names.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
        if (remaining.length > 0) { setLastReadName(remaining[0]); setIsNewName(true); }
        else { setLastReadName(names[0] || null); setIsNewName(false); }
      };
      AsyncStorage.getItem('last_reading_progress')
        .then(saved => {
          if (saved) {
            const progress = JSON.parse(saved);
            const nameObj = names.find(n => n.number === progress.nameNumber);
            if (nameObj) { setLastReadName(nameObj); setIsNewName(false); setLastReadTimestamp(progress.timestamp || null); return; }
          }
          pickRemaining(); setLastReadTimestamp(null);
        })
        .catch(() => { pickRemaining(); setLastReadTimestamp(null); });
    }, [names, learnedIds, masteredIds])
  );

  // ——— Suggested names —————————————————————————————————————————————————————————————————————————
  const activeDraftIds = React.useMemo(() => {
    return (draftIds || []).filter(id => !learnedIds.includes(id) && !masteredIds.includes(id));
  }, [draftIds, learnedIds, masteredIds]);

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

  // ——— Dynamic Progress Helper ——————————————————————————————————————————————————————————————————————
  const getTotalSteps = React.useCallback((name) => {
    let count = 1; // meaning
    if (name.gifts && name.gifts.length > 0) count++;
    if ((name.quran && name.quran.length > 0) || (name.quranic && name.quranic.length > 0)) count++;
    if ((name.hadith && name.hadith.length > 0) || (name.sunnah && name.sunnah.length > 0)) count++;
    if (name.practicalWays && name.practicalWays.length > 0) count++;
    count++; // reflection or mastery
    return count;
  }, []);

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

  // â”€â”€ Refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRefresh = async () => { await refresh(); };

  // â”€â”€ Greeting & initial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning!';
    if (h < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  }, []);

  const initial = useMemo(() => (user?.name || 'Wahid').charAt(0).toUpperCase(), [user]);

  // ——— Stats ————————————————————————————————————————————————————————————————————————————————————————
  const stats = useMemo(() => {
    const total = 99;
    const learned = learnedIds.length;
    const mastered = masteredIds.length;
    return { learned, mastered, progress: total > 0 ? Math.round((learned / total) * 100) : 0 };
  }, [learnedIds, masteredIds]);

  // ——— Continue reading ————————————————————————————————————————————————————————————————————————————
  const handleContinueReading = async () => {
    if (!lastReadName) {
      const def = names.find(n => n.number === 1) || names[0];
      if (def) navigation.navigate('NameDetail', { name: def, initialStepIndex: 0 });
      return;
    }
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

  // ——— Draft names —————————————————————————————————————————————————————————————————————————————————
  const draftNames = useMemo(() => {
    if (!activeDraftIds || !names) return [];
    return activeDraftIds.slice(0, 4).map(id => names.find(n => n.number === id)).filter(Boolean);
  }, [activeDraftIds, names]);

  // ——— Color tokens ————————————————————————————————————————————————————————————————————————————————
  const bg       = isDark ? '#0F172A' : '#F0FBFC';
  const cardBg   = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F0F4F8' : '#0F172A';
  const textSec  = isDark ? '#94A3B8' : '#475569';
  const teal     = '#00ADC1';
  const tealLight = isDark ? 'rgba(0,173,193,0.15)' : '#E0F8FA';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EEF0';

  // ——— Render helpers ——————————————————————————————————————————————————————————————————————————————

  const SUGGEST_FALLBACK = [
    { number: -10, arabic: '\u0627\u0644\u0652\u0639\u064e\u062f\u0652\u0644',         transliteration: "Al-'Adl",   meaning: 'The Just' },
    { number: -11, arabic: '\u0627\u0644\u0652\u063a\u064e\u0641\u064f\u0648\u0631',   transliteration: 'Al-Ghafur', meaning: 'The Most Forgiving' },
    { number: -12, arabic: '\u0627\u0644\u0652\u0645\u064e\u0644\u0650\u0643',         transliteration: 'Al-Malik',  meaning: 'The King' },
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
        onPress={() => item.number > 0 && navigation.navigate('NameDetail', { name: item, initialStepIndex: 0 })}
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
    const isSelected = activeDraftIds.includes(item.number);
    
    return (
      <View key={item.number} style={[styles.suggestRow, { borderBottomColor: borderColor }]}>
        <View style={styles.suggestTextCol}>
          <Text style={[styles.suggestArabic, { color: teal }]}>{item.arabic || ''}</Text>
          <Text style={[styles.suggestTrans, { color: textPrimary }]}>{item.transliteration || ''}</Text>
          <Text style={[styles.suggestMeaning, { color: textSec }]}>{item.meaning || ''}</Text>
        </View>
        <View style={styles.suggestRight}>
          <TouchableOpacity
            style={[styles.checkBtn, { backgroundColor: teal }]}
            activeOpacity={0.8}
            onPress={() => {
              if (isSelected) {
                removeDraft(item.number);
              } else {
                if (activeDraftIds.length >= 4) {
                  setDraftLimitModalVisible(true);
                } else {
                  markAsDraft(item.number);
                }
              }
            }}
          >
            <Ionicons name={isSelected ? 'checkmark' : 'add'} size={rs(16)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* —— HEADER —— */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: tealLight }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={[styles.avatarText, { color: teal }]}>{initial}</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.helloText, { color: textSec }]}>Hello {user?.name || 'Demo User'},</Text>
            <Text style={[styles.greetingText, { color: textPrimary }]}>{greeting}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.bellBtn, { backgroundColor: cardBg, borderColor }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications" size={rs(20)} color={teal} />
          {unreadNotifications > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      {/* â•â• SCROLL BODY â•â• */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={teal} colors={[teal]} />
        }
      >

        {/* â”€â”€ IN PROGRESS CARD â”€â”€ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Top row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: tealLight }]}>
                <Ionicons name="book-outline" size={rs(18)} color={teal} />
              </View>
              <View>
                <Text style={[styles.cardBadgeText, { color: teal }]}>IN PROGRESS</Text>
                <Text style={[styles.cardSubText, { color: textSec }]}>Continue your journey</Text>
              </View>
            </View>
            <View style={[styles.timeBadge, { backgroundColor: tealLight, borderColor: isDark ? 'rgba(0,173,193,0.3)' : '#BFECEF' }]}>
              <Ionicons name="time-outline" size={rs(12)} color={teal} />
              <Text style={[styles.timeText, { color: teal }]}>Just now</Text>
            </View>
          </View>

          {/* Name + book image */}
          <View style={styles.inProgressContent}>
            <View style={styles.inProgressLeft}>
              <Text style={[styles.inProgressArabic, { color: teal }]}>{lastReadName?.arabic || 'Ø§Ù„Ø£ÙŽØ¹Ù’Ù„ÙŽÙ‰'}</Text>
              <Text style={[styles.inProgressTrans, { color: textPrimary }]}>
                {lastReadName?.transliteration || "Al-A'lÄ"}
              </Text>
              <Text style={[styles.inProgressMeaning, { color: textSec }]}>
                {lastReadName?.meaning || 'The Most High'}
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={handleContinueReading} style={styles.continueBtn}>
                <LinearGradient
                  colors={['#00ADC1', '#0090A8']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.continueBtnGradient}
                >
                  <Text style={styles.continueBtnText}>
                    {'Continue Reading'}
                  </Text>
                  <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
                </LinearGradient>
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

        {/* â”€â”€ DRAFT SECTION â”€â”€ */}
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
          {draftNames.length > 0 ? (
            <View style={styles.draftList}>
              {draftNames.map((item) => renderDraftCard({ item }))}
              {Array.from({ length: Math.max(0, 4 - draftNames.length) }).map((_, i) => (
                <View key={`empty-${i}`} style={{ flex: 1 }} />
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: rs(16), alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: rs(14), color: textSec }}>No Draft</Text>
            </View>
          )}
        </View>

        {/* â”€â”€ INVITE FRIENDS â”€â”€ */}
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

        {/* â”€â”€ SUGGESTED FOR YOU â”€â”€ */}
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
                onPress={() => navigation.navigate('SuggestedNames')}
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

        {/* â”€â”€ STATS ROW â”€â”€ */}
        <View style={[styles.statsRow, { backgroundColor: cardBg, borderColor }]}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Learned')} activeOpacity={0.8}>
            <Ionicons name="book-outline" size={rs(20)} color={textSec} />
            <Text style={[styles.statValue, { color: textPrimary }]}>{stats.learned}</Text>
            <Text style={[styles.statLabel, { color: textSec }]}>Learned</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Mastered')} activeOpacity={0.8}>
            <Ionicons name="trophy-outline" size={rs(20)} color="#F59E0B" />
            <Text style={[styles.statValue, { color: textPrimary }]}>{stats.mastered}</Text>
            <Text style={[styles.statLabel, { color: textSec }]}>Mastered</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <TouchableOpacity style={styles.statItem} activeOpacity={0.8}>
            <Ionicons name="bar-chart-outline" size={rs(20)} color={textSec} />
            <Text style={[styles.statValue, { color: textPrimary }]}>{stats.progress}%</Text>
            <Text style={[styles.statLabel, { color: textSec }]}>Progress</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: rs(40) }} />
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
              Please read the existing Draft cards before adding the next card.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: teal }]}
              onPress={() => setDraftLimitModalVisible(false)}
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

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
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
  cardBadgeText: { fontFamily: FONTS.bold, fontSize: rs(11), letterSpacing: 0.6, textTransform: 'uppercase' },
  cardSubText: { fontFamily: FONTS.regular, fontSize: rs(11), marginTop: rs(1) },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(12), borderWidth: 1,
  },
  timeText: { fontFamily: FONTS.bold, fontSize: rs(11) },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(2) },
  viewAllText: { fontFamily: FONTS.medium, fontSize: rs(13) },

  // IN PROGRESS
  inProgressContent: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'visible' },
  inProgressLeft: { flex: 1, paddingRight: rs(4) },
  inProgressArabic: { fontFamily: FONTS.bold, fontSize: rs(13), marginBottom: rs(3) },
  inProgressTrans: { fontFamily: FONTS.bold, fontSize: rs(24), lineHeight: rs(28) },
  inProgressMeaning: { fontFamily: FONTS.regular, fontSize: rs(12), marginBottom: rs(14), marginTop: rs(2) },
  continueBtn: {
    borderRadius: rs(10), overflow: 'hidden', alignSelf: 'stretch',
    shadowColor: '#00ADC1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  continueBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingVertical: rs(11), borderRadius: rs(10),
  },
  continueBtnText: { fontFamily: FONTS.bold, fontSize: rs(13), color: '#FFFFFF', letterSpacing: 0.3, flex: 1 },
  inProgressRight: {
    width: rs(120), alignItems: 'center', justifyContent: 'flex-start',
    marginTop: rs(-12), overflow: 'visible',
  },
  bookImg: { width: rs(130), height: rs(155) },

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
  checkBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), justifyContent: 'center', alignItems: 'center' },
  draftNote: { flexDirection: 'row', alignItems: 'center', gap: rs(6), paddingTop: rs(12), marginTop: rs(4), borderTopWidth: 1 },
  draftNoteText: { fontFamily: FONTS.medium, fontSize: rs(12) },

  // STATS
  statsRow: {
    flexDirection: 'row', borderRadius: rs(16), borderWidth: 1, paddingVertical: rs(16),
    marginBottom: rs(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: rs(4) },
  statValue: { fontFamily: FONTS.bold, fontSize: rs(18), lineHeight: rs(22) },
  statLabel: { fontFamily: FONTS.regular, fontSize: rs(12) },
  statDivider: { width: 1, height: '70%', alignSelf: 'center' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  modalContainer: { width: '100%', borderRadius: rs(16), padding: rs(24), borderWidth: 1, alignItems: 'center' },
  modalText: { fontFamily: FONTS.medium, fontSize: rs(15), textAlign: 'center', lineHeight: rs(22), marginBottom: rs(24) },
  modalButton: { paddingVertical: rs(12), paddingHorizontal: rs(32), borderRadius: rs(8), alignItems: 'center', width: '100%' },
  modalButtonText: { fontFamily: FONTS.bold, fontSize: rs(14), color: '#FFFFFF' },
});


export default HomeScreen;
