import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, RefreshControl, Image, ImageBackground, Modal, Animated, Easing, FlatList, Share } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useFontSettings } from '../context/FontSettingsContext';
import http from '../config/http';
import LiquidText from '../components/LiquidText';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';
import TimeBasedBackground from '../components/TimeBasedBackground';
const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);
const hs = (n) => Math.round(n * hScale);
const SURAHS = [
  { number: 1, name: "Al-Fatihah" },
  { number: 2, name: "Al-Baqarah" },
  { number: 3, name: "Aal-e-Imran" },
  { number: 4, name: "An-Nisa" },
  { number: 5, name: "Al-Ma'idah" },
  { number: 6, name: "Al-An'am" },
  { number: 7, name: "Al-A'raf" },
  { number: 8, name: "Al-Anfal" },
  { number: 9, name: "At-Tawbah" },
  { number: 10, name: "Yunus" },
  { number: 11, name: "Hud" },
  { number: 12, name: "Yusuf" },
  { number: 13, name: "Ar-Ra'd" },
  { number: 14, name: "Ibrahim" },
  { number: 15, name: "Al-Hijr" },
  { number: 16, name: "An-Nahl" },
  { number: 17, name: "Al-Isra" },
  { number: 18, name: "Al-Kahf" },
  { number: 19, name: "Maryam" },
  { number: 20, name: "Ta-Ha" },
  { number: 21, name: "Al-Anbiya" },
  { number: 22, name: "Al-Hajj" },
  { number: 23, name: "Al-Mu'minun" },
  { number: 24, name: "An-Nur" },
  { number: 25, name: "Al-Furqan" },
  { number: 26, name: "Ash-Shu'ara" },
  { number: 27, name: "An-Naml" },
  { number: 28, name: "Al-Qasas" },
  { number: 29, name: "Al-Ankabut" },
  { number: 30, name: "Ar-Rum" },
  { number: 31, name: "Luqman" },
  { number: 32, name: "As-Sajdah" },
  { number: 33, name: "Al-Ahzab" },
  { number: 34, name: "Saba" },
  { number: 35, name: "Fatir" },
  { number: 36, name: "Ya-Sin" },
  { number: 37, name: "As-Saffat" },
  { number: 38, name: "Sad" },
  { number: 39, name: "Az-Zumar" },
  { number: 40, name: "Ghafir" },
  { number: 41, name: "Fussilat" },
  { number: 42, name: "Ash-Shura" },
  { number: 43, name: "Az-Zukhruf" },
  { number: 44, name: "Ad-Dukhan" },
  { number: 45, name: "Al-Jathiyah" },
  { number: 46, name: "Al-Ahqaf" },
  { number: 47, name: "Muhammad" },
  { number: 48, name: "Al-Fath" },
  { number: 49, name: "Al-Hujurat" },
  { number: 50, name: "Qaf" },
  { number: 51, name: "Adh-Dhariyat" },
  { number: 52, name: "At-Tur" },
  { number: 53, name: "An-Najm" },
  { number: 54, name: "Al-Qamar" },
  { number: 55, name: "Ar-Rahman" },
  { number: 56, name: "Al-Waqi'ah" },
  { number: 57, name: "Al-Hadid" },
  { number: 58, name: "Al-Mujadilah" },
  { number: 59, name: "Al-Hashr" },
  { number: 60, name: "Al-Mumtahanah" },
  { number: 61, name: "As-Saff" },
  { number: 62, name: "Al-Jumu'ah" },
  { number: 63, name: "Al-Munafiqun" },
  { number: 64, name: "At-Taghabun" },
  { number: 65, name: "At-Talaq" },
  { number: 66, name: "At-Tahrim" },
  { number: 67, name: "Al-Mulk" },
  { number: 68, name: "Al-Qalam" },
  { number: 69, name: "Al-Haqqah" },
  { number: 70, name: "Al-Ma'arij" },
  { number: 71, name: "Nuh" },
  { number: 72, name: "Al-Jinn" },
  { number: 73, name: "Al-Muzzammil" },
  { number: 74, name: "Al-Muddaththir" },
  { number: 75, name: "Al-Qiyamah" },
  { number: 76, name: "Al-Insan" },
  { number: 77, name: "Al-Mursalat" },
  { number: 78, name: "An-Naba" },
  { number: 79, name: "An-Nazi'at" },
  { number: 80, name: "'Abasa" },
  { number: 81, name: "At-Takwir" },
  { number: 82, name: "Al-Infitar" },
  { number: 83, name: "Al-Mutaffifin" },
  { number: 84, name: "Al-Inshiqaq" },
  { number: 85, name: "Al-Buruj" },
  { number: 86, name: "At-Tariq" },
  { number: 87, name: "Al-A'la" },
  { number: 88, name: "Al-Ghashiyah" },
  { number: 89, name: "Al-Fajr" },
  { number: 90, name: "Al-Balad" },
  { number: 91, name: "Ash-Shams" },
  { number: 92, name: "Al-Layl" },
  { number: 93, name: "Ad-Duha" },
  { number: 94, name: "Ash-Sharh" },
  { number: 95, name: "At-Tin" },
  { number: 96, name: "Al-'Alaq" },
  { number: 97, name: "Al-Qadr" },
  { number: 98, name: "Al-Bayyinah" },
  { number: 99, name: "Az-Zalzalah" },
  { number: 100, name: "Al-'Adiyat" },
  { number: 101, name: "Al-Qari'ah" },
  { number: 102, name: "At-Takathur" },
  { number: 103, name: "Al-'Asr" },
  { number: 104, name: "Al-Humazah" },
  { number: 105, name: "Al-Fil" },
  { number: 106, name: "Quraysh" },
  { number: 107, name: "Al-Ma'un" },
  { number: 108, name: "Al-Kauthar" },
  { number: 109, name: "Al-Kafirun" },
  { number: 110, name: "An-Nasr" },
  { number: 111, name: "Al-Masad" },
  { number: 112, name: "Al-Ikhlas" },
  { number: 113, name: "Al-Falaq" },
  { number: 114, name: "An-Nas" }
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { scaleFontSize } = useFontSettings();
  const { names, learnedIds, masteredIds, streak, refresh, refreshing, categories, draftIds } = useNames();
  const isDraftLimitReached = isNewName && (draftIds?.length >= 5);

  const [readingProgress, setReadingProgress] = React.useState({
    surahName: 'Al-Fatihah',
    surahNumber: 1,
    ayahNumber: 1,
  });
  const [modalVisible, setModalVisible] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [selectedSurah, setSelectedSurah] = React.useState(SURAHS[0]);
  const [ayahInput, setAyahInput] = React.useState('1');

  const [lastReadName, setLastReadName] = React.useState(null);
  const [isNewName, setIsNewName] = React.useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = React.useState(null);

  const displayTime = useMemo(() => {
    if (!lastReadTimestamp) return 'Just now';
    const date = new Date(lastReadTimestamp);
    const now = new Date();
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return `Today, ${timeString}`;
    if (isYesterday) return `Yesterday, ${timeString}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeString}`;
  }, [lastReadTimestamp]);

  const [catSortOrder, setCatSortOrder] = React.useState('default');
  const [catSortModalVisible, setCatSortModalVisible] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const lastNotifFetchRef = React.useRef(0);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Throttle: skip if fetched within the last 30 seconds
      if (now - lastNotifFetchRef.current < 30_000) return;
      lastNotifFetchRef.current = now;
      http.get('/api/notifications')
        .then(res => {
          if (res.data?.success) {
            setUnreadNotifications(res.data.data.unreadCount || 0);
          }
        })
        .catch(() => { });
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!names || names.length === 0) return;

      const pickRemaining = () => {
        const remaining = names.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
        if (remaining.length > 0) {
          setLastReadName(remaining[0]);
          setIsNewName(true);
        } else {
          setLastReadName(names[0] || null);
          setIsNewName(false);
        }
      };

      AsyncStorage.getItem('last_reading_progress')
        .then(saved => {
          if (saved) {
            const progress = JSON.parse(saved);
            const nameObj = names.find(n => n.number === progress.nameNumber);
            if (nameObj) {
              setLastReadName(nameObj);
              setIsNewName(false);
              setLastReadTimestamp(progress.timestamp || null);
              return;
            }
          }
          pickRemaining();
          setLastReadTimestamp(null);
        })
        .catch(() => {
          pickRemaining();
          setLastReadTimestamp(null);
        });
    }, [names, learnedIds, masteredIds])
  );

  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const floatLoopRef = React.useRef(null);

  React.useEffect(() => {
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

  const handleBackToReading = async () => {
    if (isDraftLimitReached) {
      navigation.navigate('NamesList', { statusFilter: 'drafts' });
      return;
    }

    if (!lastReadName) {
      const defaultName = names.find(n => n.number === 1) || names[0];
      if (defaultName) {
        navigation.navigate('NameDetail', { name: defaultName, initialStepIndex: 0 });
      }
      return;
    }

    const nameNumber = lastReadName.number || lastReadName.id;
    try {
      const [savedProgress, savedDraft] = await Promise.all([
        AsyncStorage.getItem('last_reading_progress'),
        AsyncStorage.getItem(`draft_progress_${nameNumber}`)
      ]);
      const progress = savedProgress ? JSON.parse(savedProgress) : null;
      const draft = savedDraft ? JSON.parse(savedDraft) : null;

      const initialStepIndex =
        progress?.nameNumber === nameNumber ? (progress.stepIndex ?? 0) : 0;

      navigation.navigate('NameDetail', {
        name: lastReadName,
        initialStepIndex,
        draftProgress: draft
      });
    } catch {
      navigation.navigate('NameDetail', { name: lastReadName, initialStepIndex: 0 });
    }
  };

  const fetchReadingProgress = async () => {
    try {
      const res = await http.get('/api/reading');
      if (res.data?.success && res.data?.data) {
        setReadingProgress(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch reading progress', err.message);
    }
  };

  React.useEffect(() => {
    fetchReadingProgress();
    refresh(); // Sync latest streak and progress from backend database
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refresh(),
      fetchReadingProgress()
    ]);
  };

  const filteredSurahs = useMemo(() => {
    if (!searchText) return SURAHS;
    return SURAHS.filter(s => s.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [searchText]);

  const handleSaveProgress = async () => {
    const ayahNum = parseInt(ayahInput) || 1;
    const updatePayload = {
      surahName: selectedSurah.name,
      surahNumber: selectedSurah.number,
      ayahNumber: ayahNum
    };

    // 1. Optimistic Update
    setReadingProgress(updatePayload);
    setModalVisible(false);

    // 2. POST request to backend
    try {
      const res = await http.post('/api/reading', updatePayload);
      if (res.data?.success && res.data?.data) {
        setReadingProgress(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to save reading progress", err.message);
    }
  };

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
    const catsObj = categories || CATEGORIES || {};
    Object.keys(catsObj).forEach(key => {
      result[key] = { total: 0, learned: 0 };
    });
    names.forEach(name => {
      const cat = name.category ? name.category.toLowerCase() : null;
      if (cat && result[cat]) {
        result[cat].total += 1;
        if (learnedIds.includes(name.number) || masteredIds.includes(name.number)) {
          result[cat].learned += 1;
        }
      }
    });
    return result;
  }, [names, learnedIds, categories]);

  const sortedCategories = React.useMemo(() => {
    let cats = Object.values(categories || CATEGORIES || {});
    if (catSortOrder === 'high') {
      cats.sort((a, b) => {
        const csA = categoryStats[a.id] || { total: 0, learned: 0 };
        const pctA = csA.total > 0 ? (csA.learned / csA.total) : 0;
        const csB = categoryStats[b.id] || { total: 0, learned: 0 };
        const pctB = csB.total > 0 ? (csB.learned / csB.total) : 0;
        return pctB - pctA;
      });
    } else if (catSortOrder === 'low') {
      cats.sort((a, b) => {
        const csA = categoryStats[a.id] || { total: 0, learned: 0 };
        const pctA = csA.total > 0 ? (csA.learned / csA.total) : 0;
        const csB = categoryStats[b.id] || { total: 0, learned: 0 };
        const pctB = csB.total > 0 ? (csB.learned / csB.total) : 0;
        return pctA - pctB;
      });
    }
    return cats;
  }, [categoryStats, catSortOrder, categories]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            {/* ── Pinned Top Section ── */}
            <View style={styles.fixedTopContainer}>
              {/* ── Header ── */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity style={[styles.avatarBubble, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#cffafe' }]} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
                    <Text style={[styles.avatarInitial, { color: '#06b6d4' }]}>{initial}</Text>
                  </TouchableOpacity>
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
                    style={[
                      styles.bellButton,
                      {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'
                      }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Notifications')}
                  >
                    <View style={styles.bellIconWrapper}>
                      <Ionicons name="notifications" size={21} color="#06b6d4" />
                      {unreadNotifications > 0 && <View style={styles.notificationDot} />}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Scrollable Content ── */}
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            >
              <View style={{ paddingBottom: 16 }}>
                {/* ── Last Read Card ── */}
                <View style={styles.lastReadCardWrapper}>
                  <LinearGradient
                    colors={isDark ? ['#0B1B29', '#08131E'] : ['#F0FCFD', '#E0F8FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.lastReadCard,
                      {
                        flexDirection: 'column',
                        height: 'auto',
                        minHeight: hs(180),
                        paddingBottom: hs(16),
                        overflow: 'hidden',
                        borderRadius: rs(16),
                        borderColor: isDark ? '#1C3A4B' : '#BFECEF',
                        borderWidth: 1.5,
                        shadowColor: '#00ADC1',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: isDark ? 0.3 : 0.15,
                        shadowRadius: 12,
                        elevation: 6
                      }
                    ]}
                  >
                    {/* Shimmer/Glow effect overlay */}
                    <LinearGradient
                      colors={isDark ? ['rgba(0,173,193,0)', 'rgba(0,173,193,0.08)', 'rgba(0,173,193,0)'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* Header Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, width: '100%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(10) }}>
                        <View style={{ width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: isDark ? 'rgba(0,173,193,0.15)' : '#DDF8F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(0,173,193,0.4)' : '#A0E4EC', shadowColor: '#00ADC1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}>
                          <Ionicons name="book-outline" size={rs(18)} color={isDark ? '#4CD5E8' : '#00ADC1'} />
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontFamily: FONTS.bold, fontSize: rs(14), letterSpacing: 0.5, textTransform: 'uppercase', color: isDark ? '#E8EDF2' : '#0F172A' }}>
                              {isDraftLimitReached ? 'Attention Required' : (isNewName ? 'New Name' : 'Last Read')}
                            </Text>
                            {/* <Ionicons name="sparkles" size={12} color={isDark ? '#4CD5E8' : '#00ADC1'} /> */}
                          </View>
                          <Text style={{ fontFamily: FONTS.medium, fontSize: rs(10), color: isDark ? '#4CD5E8' : '#0090A8', marginTop: hs(2) }}>
                            {isDraftLimitReached ? 'Focus on your progress' : 'Continue your journey'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: isDark ? 'rgba(0,173,193,0.1)' : 'rgba(255,255,255,0.8)', paddingHorizontal: rs(10), paddingVertical: hs(6), borderRadius: rs(12), borderWidth: 1, borderColor: isDark ? 'rgba(0,173,193,0.2)' : '#BFECEF' }}>
                        <Ionicons name="time-outline" size={rs(12)} color={isDark ? '#4CD5E8' : '#00ADC1'} />
                        <Text style={{ fontFamily: FONTS.bold, fontSize: rs(11), color: isDark ? '#4CD5E8' : '#00ADC1' }}>{displayTime}</Text>
                      </View>
                    </View>

                    {/* Content Row */}
                    <View style={{ flexDirection: 'row', flex: 1, marginTop: hs(10) }}>
                      <View style={[styles.lastReadLeft, { paddingLeft: rs(10) }]}>
                        <View style={[styles.lastReadTextGroup, { marginTop: hs(15), marginBottom: hs(15) }]}>
                          {isDraftLimitReached ? (
                            <>
                              <View style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.15)', paddingHorizontal: rs(10), paddingVertical: hs(4), borderRadius: rs(8), marginBottom: hs(8), alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: rs(4) }}>
                                <Ionicons name="sparkles" size={rs(12)} color="#F59E0B" />
                                <Text style={{ fontFamily: FONTS.bold, fontSize: rs(10), color: '#F59E0B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Focus Mode</Text>
                              </View>
                              <Text style={{ fontFamily: FONTS.bold, fontSize: rs(20), color: isDark ? '#E8EDF2' : '#0F172A', lineHeight: rs(24) }}>Review Drafts</Text>
                              <Text style={{ fontFamily: FONTS.medium, fontSize: rs(11), color: isDark ? '#9EAAB8' : '#64748B', marginTop: hs(6), width: '95%', lineHeight: hs(16) }}>Master your {draftIds?.length || 5} pending names before starting a new journey.</Text>
                            </>
                          ) : (
                            <>
                              <Text style={{ fontSize: rs(12), fontFamily: FONTS.arabic, color: isDark ? '#E8EDF2' : '#09B7C9', marginBottom: hs(4) }}>{lastReadName?.arabic || 'الله'}</Text>
                              <Text style={{ fontFamily: FONTS.bold, fontSize: rs(22), color: isDark ? '#E8EDF2' : '#0F172A', lineHeight: rs(26) }}>{lastReadName?.transliteration || 'Allah'}</Text>
                            </>
                          )}
                        </View>

                        <View style={{ width: '95%' }}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleBackToReading}
                            style={{
                              shadowColor: '#00ADC1',
                              shadowOffset: { width: 0, height: 6 },
                              shadowOpacity: 0.4,
                              shadowRadius: 10,
                              elevation: 8,
                              marginTop: hs(4),
                            }}
                          >
                            <LinearGradient
                              colors={isDark ? ['#09B7C9', '#068A99'] : ['#06E0F8', '#00ADC1']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: rs(18),
                                paddingVertical: hs(12),
                                borderRadius: rs(10),
                                width: '100%',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                                overflow: 'hidden',
                              }}
                            >
                              {/* Highlight Shimmer overlay */}
                              <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                              />
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.75}
                                  style={{ color: '#ffffff', fontSize: rs(13), fontFamily: FONTS.bold, letterSpacing: 0.5, flex: 1, marginRight: rs(8) }}
                                >
                                  {isDraftLimitReached ? 'Study Drafts' : (isNewName ? 'Start New Name' : 'Continue Reading')}
                                </Text>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: scaleFontSize(24), height: scaleFontSize(24), borderRadius: scaleFontSize(12), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, flexShrink: 0 }}>
                                  <Ionicons name="arrow-forward" size={scaleFontSize(14)} color="#ffffff" />
                                </View>
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.lastReadRight}>
                        <Animated.Image
                          source={require('../../assets/names/book.png')}
                          style={[
                            styles.lastReadBookImage,
                            {
                              top: hs(-15),
                              right: rs(-40),
                              transform: [
                                { scale: 1.15 },
                                { rotate: '2deg' },
                                {
                                  translateY: floatAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -10]
                                  })
                                }
                              ]
                            }
                          ]}
                          resizeMode="contain"
                        />
                      </View>
                    </View>


                  </LinearGradient>
                </View>

                {/* ── Progress Card ── */}
                <LinearGradient
                  colors={isDark ? ['#121F2F', '#0D1621'] : ['#F9FCFD', '#F0F8FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.progressContainer,
                    {
                      borderRadius: rs(16),
                      borderColor: isDark ? 'rgba(0,173,193,0.2)' : '#D6F2F5',
                      borderWidth: 1.5,
                      shadowColor: '#00ADC1',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isDark ? 0.2 : 0.1,
                      shadowRadius: 15,
                      elevation: 6,
                      overflow: 'hidden'
                    }
                  ]}
                >
                  {/* Decorative glowing overlay */}
                  <LinearGradient
                    colors={isDark ? ['rgba(0,173,193,0.1)', 'rgba(0,0,0,0)'] : ['rgba(0,173,193,0.05)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <View style={styles.progressHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                      <View style={{ width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: isDark ? 'rgba(0,173,193,0.15)' : '#E0F8FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(0,173,193,0.3)' : '#BFECEF' }}>
                        <Ionicons name="stats-chart" size={rs(14)} color="#00ADC1" />
                      </View>
                      <Text style={[styles.progressTitle, { color: isDark ? '#E8EDF2' : '#0F172A', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: rs(13), fontFamily: FONTS.bold }]}>Learning Journey</Text>
                    </View>
                    <View style={{ backgroundColor: isDark ? 'rgba(0,173,193,0.15)' : '#E0F8FA', paddingHorizontal: rs(12), paddingVertical: hs(6), borderRadius: rs(12), borderWidth: 1, borderColor: isDark ? 'rgba(0,173,193,0.3)' : '#BFECEF' }}>
                      <Text style={[styles.progressPercentText, { color: '#00ADC1', fontSize: rs(13), fontFamily: FONTS.bold }]}>
                        {Math.round(stats.progress)}%
                      </Text>
                    </View>
                  </View>

                  {/* Elegant Progress Bar */}
                  <View style={[
                    styles.progressBarBg,
                    {
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#E9EFF5',
                      height: hs(14),
                      borderRadius: rs(7),
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                      overflow: 'hidden'
                    }
                  ]}>
                    <LinearGradient
                      colors={isDark ? ['#00ADC1', '#0DF2FF'] : ['#09B7C9', '#05E1FA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stats.progress}%`,
                          borderRadius: rs(7),
                          height: '100%',
                          position: 'relative',
                          shadowColor: '#00ADC1',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 8,
                          elevation: 4
                        }
                      ]}
                    >
                      {/* Glossy top highlight */}
                      <LinearGradient
                        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {/* Glowing head at the tip of the progress */}
                      {stats.progress > 5 && (
                        <View style={{
                          position: 'absolute',
                          right: rs(2),
                          top: hs(2),
                          bottom: hs(2),
                          width: rs(10),
                          backgroundColor: '#FFFFFF',
                          borderRadius: rs(5),
                          shadowColor: '#FFFFFF',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 1,
                          shadowRadius: 5,
                        }} />
                      )}
                    </LinearGradient>
                  </View>

                  <Text style={[styles.progressSubtitleText, { marginTop: hs(6) }]}>
                    <Text style={{ color: '#00ADC1', fontFamily: FONTS.bold }}>{stats.learned}</Text>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}> of 99 Names Completed</Text>
                  </Text>

                  <View style={[styles.progressDivider, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', marginVertical: hs(16) }]} />

                  <View style={styles.metricsRow}>
                    {/* Learned Metric Card (Elegant Horizontal) */}
                    <TouchableOpacity
                      style={{ flex: 1, marginRight: hs(6) }}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('Learned')}
                    >
                      <LinearGradient
                        colors={isDark ? ['#0B2217', '#143628'] : ['#F2FCF5', '#E6F9EC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: rs(12),
                          paddingVertical: hs(8),
                          paddingHorizontal: rs(10),
                          borderWidth: 1,
                          borderColor: isDark ? '#1C4A36' : '#BFF0D4',
                          shadowColor: '#10B981',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDark ? 0.3 : 0.15,
                          shadowRadius: 8,
                          elevation: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <LinearGradient
                          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />

                        <View style={{
                          width: rs(28),
                          height: rs(28),
                          borderRadius: rs(14),
                          backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1F4E0',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7E9C4',
                          marginRight: rs(8)
                        }}>
                          <Image source={require('../../assets/home/learn_icon.png')} style={{ width: rs(14), height: rs(14), tintColor: '#10B981' }} resizeMode="contain" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: FONTS.medium, fontSize: rs(9), color: '#10B981', letterSpacing: 0.5, textTransform: 'uppercase' }}>Learned</Text>
                          <Text style={{ fontFamily: FONTS.bold, fontSize: rs(18), color: isDark ? '#A7F3D0' : '#065F46', marginTop: hs(1) }}>{stats.learned}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Mastered Metric Card (Elegant Horizontal) */}
                    <TouchableOpacity
                      style={{ flex: 1, marginLeft: hs(6) }}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('Mastered')}
                    >
                      <LinearGradient
                        colors={isDark ? ['#1F170A', '#332714'] : ['#FFFDF2', '#FFF8DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: rs(12),
                          paddingVertical: hs(8),
                          paddingHorizontal: rs(10),
                          borderWidth: 1,
                          borderColor: isDark ? '#5C4410' : '#FBE38E',
                          shadowColor: '#F59E0B',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDark ? 0.3 : 0.15,
                          shadowRadius: 8,
                          elevation: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <LinearGradient
                          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />

                        <View style={{
                          width: rs(28),
                          height: rs(28),
                          borderRadius: rs(14),
                          backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFF0B3',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
                          marginRight: rs(8)
                        }}>
                          <Image source={require('../../assets/home/master_icon.png')} style={{ width: rs(14), height: rs(14), tintColor: '#F59E0B' }} resizeMode="contain" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: FONTS.medium, fontSize: rs(9), color: '#F59E0B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Mastered</Text>
                          <Text style={{ fontFamily: FONTS.bold, fontSize: rs(18), color: isDark ? '#FDE68A' : '#92400E', marginTop: hs(1) }}>{stats.mastered}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                  </View>
                </LinearGradient>

                {/* ── Invite Card ── */}
                <TouchableOpacity
                  style={[
                    styles.inviteCard,
                    {
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
                      marginBottom: 16,
                      marginTop: 0
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Share.share({
                      message: 'Join me in learning the 99 Names of Allah on the Wahid App! Download now: https://wahidapp.com',
                    });
                  }}
                >
                  <LinearGradient
                    colors={isDark ? ['rgba(6, 182, 212, 0.1)', 'transparent'] : ['#ecfeff', '#ffffff']}
                    style={styles.inviteCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inviteLeft}>
                      <View style={[styles.inviteIconWrap, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : '#cffafe' }]}>
                        <Ionicons name="people" size={24} color="#06b6d4" />
                      </View>
                      <View style={styles.inviteTextCol}>
                        <Text style={[styles.inviteTitle, { color: colors.text }]}>Invite Friends</Text>
                        <Text style={[styles.inviteSub, { color: colors.textMuted }]}>Share the blessing of learning</Text>
                      </View>
                    </View>
                    <View style={styles.inviteShareBtn}>
                      <Ionicons name="share-social" size={18} color="#ffffff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* ── Categories Section Title ── */}
                <View style={styles.categoriesHeaderRow}>
                  <Text style={[styles.categoriesTitle, { color: colors.text }]}>Categories</Text>
                  <TouchableOpacity onPress={() => setCatSortModalVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="filter" size={20} color="#06b6d4" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.catVerticalList}>
                {sortedCategories.map((cat) => {
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

                          <View style={styles.catCountRow}>
                            <Text style={[styles.catCompletedCount, { color: progressColor }]}>{cs.learned}</Text>
                            <Text style={[styles.catCountDivider, { color: colors.textMuted }]}> / </Text>
                            <Text style={[styles.catCountTotal, { color: colors.textMuted }]}>{cs.total}</Text>
                            <Text style={[styles.catCountLabel, { color: colors.textMuted }]}> completed</Text>
                          </View>

                        </View>

                        <View style={styles.catRightSection}>
                          <LiquidText
                            text={`${pct}%`}
                            percentage={pct}
                            baseColor={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'}
                            fillColor={progressColor}
                            textStyle={styles.giantPercentage}
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}

              </View>
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Update Reading Progress Modal ── */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
              >
                <TouchableOpacity
                  style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
                  activeOpacity={1}
                >
                  <View style={styles.modalHandle} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Update Reading Progress</Text>

                  {/* Search Surah */}
                  <View style={[styles.modalSearchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                    <Ionicons name="search" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : '#64748b'} />
                    <TextInput
                      style={[styles.modalSearchInput, { color: colors.text }]}
                      placeholder="Search Surah..."
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#64748b'}
                      value={searchText}
                      onChangeText={setSearchText}
                    />
                  </View>

                  {/* Selected Surah Label */}
                  <Text style={[styles.selectedLabel, { color: colors.textMuted }]}>
                    Selected: <Text style={{ fontWeight: 'bold', color: '#06b6d4' }}>{selectedSurah.name} (Surah {selectedSurah.number})</Text>
                  </Text>

                  {/* Surah List */}
                  <View style={[styles.surahListContainer, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                      {filteredSurahs.map((s) => (
                        <TouchableOpacity
                          key={s.number}
                          style={[
                            styles.surahRow,
                            selectedSurah.number === s.number && { backgroundColor: 'rgba(6, 182, 212, 0.15)' }
                          ]}
                          onPress={() => setSelectedSurah(s)}
                        >
                          <Text style={[styles.surahRowText, { color: colors.text }, selectedSurah.number === s.number && { fontWeight: '700', color: '#06b6d4' }]}>
                            {s.number}. {s.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Ayah Input */}
                  <View style={styles.ayahInputSection}>
                    <Text style={[styles.ayahInputLabel, { color: colors.text }]}>Ayah Number:</Text>
                    <View style={styles.ayahInputRow}>
                      <TouchableOpacity
                        style={[styles.counterBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }]}
                        onPress={() => {
                          const val = Math.max(1, (parseInt(ayahInput) || 1) - 1);
                          setAyahInput(String(val));
                        }}
                      >
                        <Ionicons name="remove" size={20} color={colors.text} />
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.ayahInputText, { color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1' }]}
                        keyboardType="number-pad"
                        value={ayahInput}
                        onChangeText={(val) => setAyahInput(val.replace(/[^0-9]/g, ''))}
                      />

                      <TouchableOpacity
                        style={[styles.counterBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }]}
                        onPress={() => {
                          const val = (parseInt(ayahInput) || 1) + 1;
                          setAyahInput(String(val));
                        }}
                      >
                        <Ionicons name="add" size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveProgress}
                  >
                    <Text style={styles.saveBtnText}>Save Progress</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {/* ── Category Sort Modal ── */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={catSortModalVisible}
              onRequestClose={() => setCatSortModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={1}
                  onPress={() => setCatSortModalVisible(false)}
                />
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#ffffff', minHeight: 250 }]}>
                  <View style={styles.modalHandle} />
                  <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 20 }]}>Sort Categories</Text>

                  {[
                    { id: 'default', label: 'Default Order', icon: 'list' },
                    { id: 'high', label: 'Highest Completion', icon: 'arrow-up' },
                    { id: 'low', label: 'Lowest Completion', icon: 'arrow-down' },
                  ].map((option) => {
                    const isSelected = catSortOrder === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.sortOptionRow,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? 'rgba(6,182,212,0.15)' : '#ecfeff')
                              : 'transparent',
                            borderColor: isSelected
                              ? '#06b6d4'
                              : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9')
                          }
                        ]}
                        onPress={() => {
                          setCatSortOrder(option.id);
                          setCatSortModalVisible(false);
                        }}
                      >
                        <Ionicons name={option.icon} size={20} color={isSelected ? "#06b6d4" : colors.textMuted} />
                        <Text style={[styles.sortOptionText, { color: isSelected ? "#06b6d4" : colors.text }]}>
                          {option.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#06b6d4" style={{ marginLeft: 'auto' }} />}
                      </TouchableOpacity>
                    );
                  })}
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

  // ── Last Read Styles ──
  lastReadCardWrapper: {
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: SPACE.lg,
  },
  lastReadCard: {
    flexDirection: 'row',
    borderRadius: rs(10),
    paddingVertical: hs(12),
    paddingHorizontal: rs(16),
    minHeight: hs(180),
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
    borderRadius: rs(6),
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
    right: rs(-20),
    top: hs(10),
    width: rs(200),
    height: hs(200),
    zIndex: 3,
  },

  // ── Progress Card Styles ──
  progressContainer: {
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
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
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  progressPercentText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACE.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSubtitleText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.sm,
    marginTop: SPACE.xs,
  },
  progressDivider: {
    borderBottomWidth: 1,
    marginVertical: SPACE.md,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCardWrapNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    height: 76,
  },
  metricDividerVertical: {
    width: 1,
    height: '70%',
    marginHorizontal: SPACE.sm,
  },
  metricCardLeft: {
    marginRight: SPACE.sm,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricCardRight: {
    flex: 1,
  },
  metricLabelText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  metricValueText: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 28,
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
  catCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 8,
  },
  catCompletedCount: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  catCountDivider: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  catCountTotal: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  catCountLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
  },
  catMiniProgressBg: {
    width: '90%',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catMiniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  giantPercentage: {
    fontFamily: FONTS.bold,
    fontSize: 44,
    textAlign: 'right',
    lineHeight: 48,
  },

  // ── Qur'an Card Styles ──
  quranCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACE.md,
    marginBottom: SPACE.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quranCardLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  quranCardTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#06b6d4',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quranCardSub: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quranCardSurah: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  quranCardAyah: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 12,
  },
  quranCardAction: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: '#06b6d4',
  },
  quranCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SPACE.sm,
  },
  quranCardBookImage: {
    width: 80,
    height: 80,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACE.lg,
    minHeight: 400,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACE.md,
    textAlign: 'center',
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.sm,
    height: 44,
    marginBottom: SPACE.sm,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: SPACE.xs,
    fontFamily: FONTS.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  selectedLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginBottom: SPACE.xs,
  },
  surahListContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACE.md,
  },
  surahRow: {
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
  },
  surahRowText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  ayahInputSection: {
    marginBottom: SPACE.lg,
  },
  ayahInputLabel: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    marginBottom: SPACE.sm,
  },
  ayahInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahInputText: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    textAlign: 'center',
    marginHorizontal: SPACE.md,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: RADIUS.sm,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACE.xs,
  },
  saveBtnText: {
    fontFamily: FONTS.bold,
    color: '#ffffff',
    fontSize: 16,
  },
  nameListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  nameListNumBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameListNumText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  nameListTextCol: {
    flex: 1,
  },
  nameListTrans: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  nameListMeaning: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 2,
  },
  nameListArabic: {
    fontFamily: FONTS.arabic,
    fontSize: 16,
    marginLeft: 10,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  sortOptionText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginLeft: 12,
  },
  inviteCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: SPACE.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  inviteCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACE.md,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACE.sm,
  },
  inviteTextCol: {
    flex: 1,
  },
  inviteTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  inviteSub: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  inviteShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACE.sm,
  },
});

export default HomeScreen;
