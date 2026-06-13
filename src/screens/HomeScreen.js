import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Image,
  ImageBackground,
  TextInput,
  Modal,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
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
  const { names, learnedIds, masteredIds, streak, refresh, refreshing, categories } = useNames();

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

  const [catSortOrder, setCatSortOrder] = React.useState('default');
  const [catSortModalVisible, setCatSortModalVisible] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      http.get('/api/notifications')
        .then(res => {
          if (res.data?.success) {
            setUnreadNotifications(res.data.data.unreadCount || 0);
          }
        })
        .catch(() => {});
    }, [])
  );

  React.useEffect(() => {
    if (!names || names.length === 0) return;

    AsyncStorage.getItem('last_viewed_name')
      .then(saved => {
        if (saved === null) return;
        const nameObj = names.find(n => n.number === parseInt(saved, 10));
        if (nameObj) setLastReadName(nameObj);
      })
      .catch(() => { });
  }, [names]);

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
    if (!lastReadName) {
      const defaultName = names.find(n => n.number === 1) || names[0];
      if (defaultName) {
        navigation.navigate('NameDetail', { name: defaultName, initialStepIndex: 0 });
      }
      return;
    }

    const nameNumber = lastReadName.number || lastReadName.id;
    try {
      const saved = await AsyncStorage.getItem('last_reading_progress');
      const progress = saved ? JSON.parse(saved) : null;
      const initialStepIndex =
        progress?.nameNumber === nameNumber ? (progress.stepIndex ?? 0) : 0;
      navigation.navigate('NameDetail', { name: lastReadName, initialStepIndex });
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
      const cat = name.category;
      if (result[cat]) {
        result[cat].total += 1;
        if (learnedIds.includes(name.number)) {
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

              {/* ── Last Read Card ── */}
              <View style={styles.lastReadCardWrapper}>
                <LinearGradient
                  colors={isDark ? ['#1A2332', '#0F172A'] : ['#4BD5E8', '#FDFEFE']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.9 }}
                  style={[styles.lastReadCard, isDark && { borderWidth: 1, borderColor: '#334155' }]}
                >
                  <View style={styles.lastReadLeft}>
                    <View style={styles.lastReadBadge}>
                      <Image
                        source={require('../../assets/navigation/names.png')}
                        style={[styles.lastReadBadgeIcon, { tintColor: isDark ? '#E8EDF2' : '#000000' }]}
                        resizeMode="contain"
                      />
                      <Text style={[styles.lastReadBadgeText, { color: isDark ? '#E8EDF2' : '#000000' }]}>Last Read</Text>
                    </View>

                    <View style={styles.lastReadTextGroup}>
                      <Text style={[styles.lastReadArabic, { color: isDark ? '#E8EDF2' : '#000000ff' }]}>{lastReadName?.arabic || 'الرحمن'}</Text>
                      <Text style={[styles.lastReadTrans, { color: isDark ? '#E8EDF2' : '#000000' }]}>{lastReadName?.transliteration || 'Ar-rahman'}</Text>
                      <Text style={[styles.lastReadMeaning, { color: isDark ? '#9EAAB8' : '#374151' }]}>{lastReadName?.meaning || 'The Most Gracious'}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.backToReadingBtn, { backgroundColor: isDark ? '#00ADC1' : '#000000' }]}
                      activeOpacity={0.8}
                      onPress={handleBackToReading}
                    >
                      <Text style={[styles.backToReadingText, { color: '#ffffff' }]}>Continue Reading</Text>
                      <Ionicons name="chevron-forward" size={15} color="#ffffff" style={{ marginLeft: 20, marginTop: 4 }} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.lastReadRight}>
                    <Animated.Image
                      source={require('../../assets/names/book.png')}
                      style={[
                        styles.lastReadBookImage,
                        {
                          transform: [
                            { rotate: '-6deg' },
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
                </LinearGradient>
              </View>

              {/* ── Progress Card ── */}
              <View style={[
                styles.progressContainer,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                }
              ]}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Your Progress</Text>
                  <Text style={[styles.progressPercentText, { color: colors.text }]}>
                    {Math.round(stats.progress)}% Completed
                  </Text>
                </View>

                <View style={[
                  styles.progressBarBg,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }
                ]}>
                  <LinearGradient
                    colors={['#06b6d4', '#22d3ee']}
                    style={[styles.progressBarFill, { width: `${stats.progress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>

                <View style={styles.metricsRow}>
                  {/* Learned Metric Card */}
                  <TouchableOpacity
                    style={styles.metricCardWrap}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('NamesList', { statusFilter: 'learned' })}
                  >
                    <ImageBackground
                      source={require('../../assets/home/sml_card.png')}
                      style={styles.metricCardBackground}
                      imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
                    >
                      <View style={styles.metricCardInner}>
                        <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.learned}</Text>
                        <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Learned</Text>

                        {/* Icon Bubble */}
                        <View style={styles.iconBubble}>
                          <Image
                            source={require('../../assets/home/learn_icon.png')}
                            style={styles.metricCardIconImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>

                  {/* Mastered Metric Card */}
                  <TouchableOpacity
                    style={styles.metricCardWrap}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('NamesList', { statusFilter: 'mastered' })}
                  >
                    <ImageBackground
                      source={require('../../assets/home/sml_card.png')}
                      style={styles.metricCardBackground}
                      imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
                    >
                      <View style={styles.metricCardInner}>
                        <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.mastered}</Text>
                        <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Mastered</Text>

                        {/* Icon Bubble */}
                        <View style={styles.iconBubble}>
                          <Image
                            source={require('../../assets/home/master_icon.png')}
                            style={styles.metricCardIconImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>

                  {/* Remaining Metric Card */}
                  <TouchableOpacity
                    style={styles.metricCardWrap}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('NamesList', { statusFilter: 'remaining' })}
                  >
                    <ImageBackground
                      source={require('../../assets/home/sml_card.png')}
                      style={styles.metricCardBackground}
                      imageStyle={[styles.metricCardImageStyle, { opacity: isDark ? 0.65 : 1 }]}
                    >
                      <View style={styles.metricCardInner}>
                        <Text style={[styles.newMetricValue, { color: isDark ? '#ffffff' : '#000000' }]}>{stats.remaining}</Text>
                        <Text style={[styles.newMetricLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }]}>Remaining</Text>

                        {/* Icon Bubble */}
                        <View style={styles.iconBubble}>
                          <Image
                            source={require('../../assets/home/remain_icon.png')}
                            style={styles.metricCardIconImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Categories Section Title ── */}
              <View style={styles.categoriesHeaderRow}>
                <Text style={[styles.categoriesTitle, { color: colors.text }]}>Categories</Text>
                <TouchableOpacity onPress={() => setCatSortModalVisible(true)} activeOpacity={0.7}>
                  <Ionicons name="filter" size={20} color="#06b6d4" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Scrollable Categories Feed ── */}
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
    right: rs(-20),
    top: hs(10),
    width: rs(140),
    height: hs(140),
    zIndex: 3,
  },

  // ── Progress Card Styles ──
  progressContainer: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
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
    color: '#06b6d4',
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
  },
  progressPercentText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACE.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCardWrap: {
    flex: 1,
  },
  metricCardBackground: {
    width: '100%',
    height: 72,
  },
  metricCardImageStyle: {
    borderRadius: 14,
    resizeMode: 'stretch',
  },
  metricCardInner: {
    flex: 1,
    paddingVertical: SPACE.xs + 2,
    paddingHorizontal: SPACE.sm,
    justifyContent: 'space-between',
    position: 'relative',
  },
  newMetricValue: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 26,
  },
  newMetricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  iconBubble: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  metricCardIconImage: {
    width: 14,
    height: 14,
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
});

export default HomeScreen;
