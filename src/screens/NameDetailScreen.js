import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, Easing,
  Image, TouchableOpacity, StatusBar, Pressable, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import NameDetailHeader from '../components/NameDetailHeader';

const { width: SW } = Dimensions.get('window');

const getField = (name, ...keys) => {
  for (const k of keys) {
    if (name[k] !== undefined && name[k] !== null && name[k] !== '') return name[k];
  }
  return null;
};

const parseBenefits = (name) => {
  const raw = getField(name, 'benefits_of_learning', 'benefits');
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(/\.\s+/).filter(Boolean);
};

const parseQuranicRef = (name) => {
  const refs = getField(name, 'quranic_references', 'quranicReferences');
  if (Array.isArray(refs) && refs.length > 0) return refs[0];
  const translation = getField(name, 'quranicTranslation', 'ayahTranslation');
  const reference = getField(name, 'quranicReference', 'surahReference', 'reference');
  if (translation) return { translation, reference };
  return { translation: `In the name of Allah, the most gracious, the most merciful`, reference: 'Al-Fatiha 1:1' };
};

const parseMcq = (name) => {
  const raw = getField(name, 'match_the_quality', 'matchTheQuality', 'mcq');
  if (raw) return Array.isArray(raw) ? raw[0] : raw;
  return {
    q: `What does ${name.transliteration} primarily signify?`,
    opts: [name.meaning, 'All-Encompassing mercy', 'The creator', 'The judge'],
    ans: 0,
  };
};

const N_SECTIONS = 6;


const NameDetailScreen = ({ route, navigation }) => {
  const { name } = route.params;
  const { markAsLearned } = useNames();


  const benefits = useMemo(() => parseBenefits(name), [name]);
  const quranicRef = useMemo(() => parseQuranicRef(name), [name]);
  const reflection = getField(name, 'reflection', 'learning_insight', 'description');
  const insight = getField(name, 'learning_insight', 'learningInsight', 'reflection', 'description');
  const mcq = useMemo(() => parseMcq(name), [name]);


  const [phase, setPhase] = useState('gift');
  const [contentStage, setContentStage] = useState(0);
  const [giftOpened, setGiftOpened] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizDone, setQuizDone] = useState(false);


  const lastTapRef = useRef(0);


  const floatAnim = useRef(new Animated.Value(0)).current;
  const giftOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const slideBtnScale = useRef(new Animated.Value(1)).current;

  const sectionAnims = useRef(
    Array.from({ length: N_SECTIONS }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(35),
    }))
  ).current;

  const journeyOpacity = useRef(new Animated.Value(0)).current;
  const journeyTranslate = useRef(new Animated.Value(50)).current;


  const floatLoopRef = useRef(null);
  const handLoopRef = useRef(null);


  useEffect(() => {
    floatLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoopRef.current.start();
    return () => floatLoopRef.current?.stop();
  }, []);


  useEffect(() => {
    if (phase !== 'content') return;
    handLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(handAnim, { toValue: 0, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    handLoopRef.current.start();
    return () => { handLoopRef.current?.stop(); handAnim.setValue(0); };
  }, [phase]);


  const handleGiftTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      floatLoopRef.current?.stop();
      setGiftOpened(true);

      Animated.sequence([
        Animated.delay(350),
        Animated.timing(giftOpacity, {
          toValue: 0, duration: 1550,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPhase('content');
        setContentStage(1);
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 350, useNativeDriver: true,
        }).start(() => revealSections(1));
      });
    }
    lastTapRef.current = now;
  }, []);


  const revealSections = useCallback((stage) => {
    handLoopRef.current?.stop();

    const progressValue = stage === 1 ? 0.4 : 1;
    Animated.timing(progressAnim, {
      toValue: progressValue, duration: 1200, easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const animSlice = stage === 1 ? sectionAnims.slice(0, 3) : sectionAnims.slice(3, 6);

    Animated.stagger(
      150,
      animSlice.map(a =>
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(a.translateY, { toValue: 0, duration: 480, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),
        ])
      )
    ).start();
  }, [sectionAnims, progressAnim]);


  const goJourney = useCallback(() => {
    setPhase('journey');
    Animated.parallel([
      Animated.timing(journeyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(journeyTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSlideTap = useCallback(() => {
    Animated.sequence([
      Animated.timing(slideBtnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(slideBtnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (contentStage === 1) {
      setContentStage(2);
      revealSections(2);
    } else if (contentStage === 2) {
      goJourney();
    }
  }, [contentStage, revealSections, goJourney]);

  // ── Physical Swiping Logic ──
  const slidePanX = useRef(new Animated.Value(0)).current;
  const slidePanResponder = useMemo(() => {
    const MAX_SLIDE = SW - 32 - 64; // width of screen minus margins minus thumb width

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        handLoopRef.current?.stop();
        handAnim.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let val = gestureState.dx;
        if (val < 0) val = 0;
        if (val > MAX_SLIDE) val = MAX_SLIDE;
        slidePanX.setValue(val);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > MAX_SLIDE * 0.7) {
          // Success swipe!
          Animated.timing(slidePanX, {
            toValue: MAX_SLIDE,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            handleSlideTap();

            // if we just revealed the second half of content, snap the slider back for the "Journey" swipe
            if (contentStage === 1) {
              slidePanX.setValue(0);
              handLoopRef.current?.start(); // re-enable hint jumping
            }
          });
        } else {
          // Snaps back
          Animated.spring(slidePanX, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            handLoopRef.current?.start();
          });
        }
      }
    });
  }, [contentStage, handleSlideTap, handAnim, slidePanX]);

  const handleQuizOption = useCallback((idx) => {
    if (quizDone) return;
    setQuizAnswer(idx);
    setQuizDone(true);
    if (idx === mcq.ans) markAsLearned(name.number);
  }, [quizDone, mcq.ans, name.number, markAsLearned]);


  if (phase === 'gift') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />

        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          {/* Header */}
          <NameDetailHeader name={name} onClose={() => navigation.goBack()} />

          <View style={styles.progressTrack} />

          <Animated.View style={[styles.giftBody, { opacity: giftOpacity }]}>
            {/* Top info */}
            <View style={styles.giftTopInfo}>
              <Text style={styles.giftTitle}>Gifts of this Name</Text>
              <View style={styles.giftSubtitleContainer}>
                <Text style={styles.giftSubtitle}>
                  What learning {name.transliteration} brings to your life
                </Text>
              </View>
            </View>

            {/* Floating gift box */}
            <View style={styles.giftBoxWrap}>
              <Pressable onPress={handleGiftTap}>
                <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                  <Image
                    source={giftOpened
                      ? require('../../assets/openGiftBox.png')
                      : require('../../assets/giftBox.png')}
                    style={styles.giftBoxImg}
                    resizeMode="contain"
                  />
                </Animated.View>
              </Pressable>
              <Image source={require('../../assets/Ellipse 5.png')} style={styles.giftShadow} resizeMode="contain" />
            </View>

            {/* Double tap hint */}
            <View style={styles.doubleTapRow}>
              <Image source={require('../../assets/signHand.png')} style={styles.handHint} resizeMode="contain" />
              <Text style={styles.doubleTapText}>Double Tap to Open</Text>
              <Image source={require('../../assets/signHand.png')} style={[styles.handHint, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  JOURNEY PHASE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'journey') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.journeyRoot} edges={['top']}>
          <Animated.View style={[styles.journeyCard, {
            opacity: journeyOpacity,
            transform: [{ translateY: journeyTranslate }],
          }]}>
            <LinearGradient
              colors={['#E8F7FB', '#FFFFFF']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.journeyTitle}>Your Journey</Text>
            <Text style={styles.journeySub}>Track your mastery of {name.transliteration}</Text>

            <View style={styles.journeyRow}>
              <View style={styles.journeyStep}>
                <View style={[styles.journeyIcon, { backgroundColor: '#E0F7FA' }]}>
                  <Image source={require('../../assets/mdi_learn-outline.png')} style={styles.journeyImg} resizeMode="contain" />
                </View>
                <Text style={styles.journeyStepLabel}>Learned</Text>
              </View>

              <View style={styles.journeyArrow}>
                <View style={styles.arrowLine} />
                <Ionicons name="chevron-forward" size={18} color="#00ADC1" />
              </View>

              <View style={styles.journeyStep}>
                <View style={[styles.journeyIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Image source={require('../../assets/Masterlock.png')} style={styles.journeyImg} resizeMode="contain" />
                </View>
                <Text style={styles.journeyStepLabel}>Mastered</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#00ADC1', '#0090A8']} style={styles.doneBtnGrad}>
                <Text style={styles.doneBtnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CONTENT PHASE
  // ─────────────────────────────────────────────────────────────────────────
  const handX = handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {/* Header */}
        <NameDetailHeader name={name} onClose={() => navigation.goBack()} />

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        {/* Scrollable content */}
        <Animated.ScrollView
          style={{ flex: 1, opacity: contentOpacity }}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Static header inside scroll */}
          <Text style={styles.giftTitleScroll}>Gifts of this Name</Text>
          <Text style={styles.giftSubtitleSmall}>
            What learning {name.transliteration} brings to your life
          </Text>

          {/* ── Section 0: Benefits ── */}
          <AnimSection anim={sectionAnims[0]}>
            <View style={styles.benefitsList}>
              {(benefits.length > 0 ? benefits.slice(0, 3) : [
                `Reciting this name brings peace and calm to an anxious heart`,
                `It opens door of mercy in one's daily life`,
                `Remind us that every blessing we have comes from his grace`,
              ]).map((text, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.benefitNumBadge}>
                    <Text style={styles.benefitNum}>{String(i + 1).padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.benefitText}>{text}</Text>
                </View>
              ))}
            </View>
          </AnimSection>

          {/* ── Section 1: Gold divider ── */}
          <AnimSection anim={sectionAnims[1]}>
            <View style={styles.dividerWrap}>
              <Image source={require('../../assets/lineGold.png')} style={styles.goldDivider} resizeMode="contain" />
            </View>
          </AnimSection>

          {/* ── Section 2: Divine Words ── */}
          <AnimSection anim={sectionAnims[2]}>
            <View style={styles.divineCard}>
              <LinearGradient
                colors={['#FFF9D6', '#FFE6A3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.divineName}>Divine Words</Text>
              <Text style={styles.divineSubtitle}>Qur'anic references to this name</Text>
              <View style={styles.quoteBlock}>
                <Image source={require('../../assets/quatation.png')} style={styles.quoteIconTop} resizeMode="contain" />
                <Text style={styles.quoteText}>
                  {quranicRef.translation || `In the name of allah, the most gracious,\nthe most merciful`}
                </Text>
                <Image source={require('../../assets/quatation.png')} style={styles.quoteIconBottom} resizeMode="contain" />
              </View>
            </View>
          </AnimSection>

          {/* ── Section 3: Ponder & Reflect ── */}
          <AnimSection anim={sectionAnims[3]} hidden={contentStage < 2}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Ponder &amp; Reflect</Text>
              <View style={styles.reflectBox}>
                <Text style={styles.reflectText}>
                  {reflection || `Every breath we take is a mercy from ${name.transliteration}. He did not wait for us to ask — His mercy arrives before any deed of ours.`}
                </Text>
              </View>
            </View>
          </AnimSection>

          {/* ── Section 4: Learning Insight ── */}
          <AnimSection anim={sectionAnims[4]} hidden={contentStage < 2}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Learning Insight</Text>
              <View style={styles.insightRow}>
                <Image source={require('../../assets/man.png')} style={styles.manImg} resizeMode="contain" />
                <View style={styles.insightBox}>
                  <Image source={require('../../assets/bgCard2.png')} style={StyleSheet.absoluteFillObject} resizeMode="stretch" borderRadius={14} />
                  <Text style={styles.insightText}>
                    {insight || `${name.transliteration} teaches that mercy pervades all existence. When you accept that grace finds you before you deserve it, you begin to live without shame and extend unconditional mercy to others.`}
                  </Text>
                </View>
              </View>
            </View>
          </AnimSection>

          {/* ── Section 5: Match the Quality (Quiz) ── */}
          <AnimSection anim={sectionAnims[5]} hidden={contentStage < 2}>
            <View style={styles.sectionCard}>
              <View style={styles.quizHeader}>
                <Image source={require('../../assets/quest.png')} style={styles.questImg} resizeMode="contain" />
                <View>
                  <Text style={styles.sectionCardTitle}>Match the Quality</Text>
                  <Text style={styles.quizSubtitle}>Test your understanding of {name.transliteration}</Text>
                </View>
              </View>
              <Text style={styles.quizQuestion}>{mcq.q}</Text>
              <View style={styles.optionsList}>
                {(mcq.opts || []).map((opt, idx) => {
                  const isChosen = quizAnswer === idx;
                  const isCorrect = idx === mcq.ans;
                  const isBad = quizDone && isChosen && !isCorrect;
                  const isGood = quizDone && isCorrect;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleQuizOption(idx)}
                      disabled={quizDone}
                      activeOpacity={0.75}
                      style={[styles.quizOption,
                      isGood && styles.quizOptionGood,
                      isBad && styles.quizOptionBad,
                      (isChosen && !quizDone) && styles.quizOptionChosen,
                      ]}
                    >
                      <View style={[styles.radioOuter,
                      isGood && { borderColor: '#00ADC1' },
                      isBad && { borderColor: '#FF4444' },
                      ]}>
                        {(isChosen || isGood) && (
                          <View style={[styles.radioInner, { backgroundColor: isGood ? '#00ADC1' : isBad ? '#FF4444' : '#AAA' }]} />
                        )}
                      </View>
                      <Text style={[styles.quizOptText,
                      isGood && { color: '#00ADC1', fontWeight: '700' },
                      isBad && { color: '#FF4444' },
                      ]}>{opt}</Text>
                      {isGood && <Ionicons name="checkmark-circle" size={18} color="#00ADC1" />}
                      {isBad && <Ionicons name="close-circle" size={18} color="#FF4444" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimSection>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* ── Fixed bottom: Slide to Continue ── */}
        <Animated.View style={[styles.slideBar, { transform: [{ scale: slideBtnScale }] }]}>
          <View style={styles.slideGrad}>
            <Animated.View
              {...slidePanResponder.panHandlers}
              style={[
                styles.slideThumb,
                { position: 'absolute', left: 0, zIndex: 10 },
                { transform: [{ translateX: slidePanX }] }
              ]}
            >
              <Animated.Image
                source={require('../../assets/signHand.png')}
                style={[styles.slideHand, { transform: [{ translateX: handX }] }]}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={[styles.slideText, { marginLeft: 80 }]}>
              {contentStage === 2 ? 'Continue to Journey' : 'Slide to Continue'}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// ─── Reusable animated section wrapper ────────────────────────────────────────
const AnimSection = ({ anim, hidden, children }) => (
  <Animated.View style={[styles.animSection, {
    opacity: anim.opacity,
    transform: [{ translateY: anim.translateY }],
    display: hidden ? 'none' : 'flex'
  }]}>
    {children}
  </Animated.View>
);


// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2FB', borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },

  // ── Gift phase ──
  giftBody: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 50, paddingHorizontal: 24, zIndex: 1 },
  giftTopInfo: { alignItems: 'flex-start', marginTop: 10, width: '100%' },
  giftTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  giftTitleScroll: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  giftSubtitleContainer: { fontWeight: '100', paddingBottom: 2 },
  giftSubtitle: { fontSize: 14, color: '#000000ff', fontWeight: '500', lineHeight: 20 },
  giftSubtitleSmall: {
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19
  },

  giftBoxWrap: {
    width: '100%',
    aspectRatio: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  giftBoxImg: { width: SW * 0.55, height: SW * 0.55 },
  giftShadow: {
    position: 'absolute',
    bottom: 85,
    width: SW * 0.5,
    height: 30,
    zIndex: -1,
  },

  doubleTapRow: { flexDirection: 'row', alignItems: 'center', gap: 25, bottom: 220 },
  handHint: { width: 32, height: 32, tintColor: '#00ADC1' },
  doubleTapText: { fontSize: 24, fontWeight: '500', color: '#00ADC1', letterSpacing: 0.3 },

  // ── Progress bar ──
  progressTrack: {
    height: 10,
    backgroundColor: '#E6E8F0',
    width: '80%',
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#20B9CC',
    borderRadius: 20,
  },

  // ── Content scroll ──
  contentScroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  animSection: { marginBottom: 18 },

  // ── Benefits ──
  benefitsList: { gap: 10 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    minHeight: 64,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  benefitNumBadge: {
    width: 80,
    backgroundColor: '#4CD6E8',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'center',
  },

  // ── Gold divider ──
  dividerWrap: {
    alignItems: 'center',
    marginVertical: 16,
  },
  goldDivider: {
    width: 180,
    height: 20,
    opacity: 0.8,
  },

  // ── Divine Words card ──
  divineCard: {
    borderRadius: 18,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF8E6',
    shadowColor: '#E6B84C',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  divineName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B4F00',
    textAlign: 'center',
    marginBottom: 3,
  },
  divineSubtitle: {
    fontSize: 12,
    color: '#A07A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  quoteBlock: { alignItems: 'center', position: 'relative' },
  quoteIconTop: { width: 28, height: 20, alignSelf: 'flex-start', tintColor: '#C9A84C', marginBottom: 4 },
  quoteIconBottom: { width: 28, height: 20, alignSelf: 'flex-end', tintColor: '#C9A84C', transform: [{ rotate: '180deg' }], marginTop: 4 },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#5A4000',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Generic section card ──
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  sectionCardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },

  // ── Reflect ──
  reflectBox: { backgroundColor: '#F0FAFB', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#00ADC1' },
  reflectText: { fontSize: 14, color: '#444', lineHeight: 22, fontStyle: 'italic' },

  // ── Insight ──
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  manImg: { width: 72, height: 90, marginTop: 4 },
  insightBox: { flex: 1, borderRadius: 14, padding: 14, minHeight: 90, overflow: 'hidden' },
  insightText: { fontSize: 13, color: '#333', lineHeight: 20 },

  // ── Quiz ──
  quizHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  questImg: { width: 36, height: 36 },
  quizSubtitle: { fontSize: 12, color: '#888', marginTop: 1 },
  quizQuestion: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 14, lineHeight: 22 },
  optionsList: { gap: 9 },
  quizOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  quizOptionChosen: { borderColor: '#00ADC150', backgroundColor: '#E8F7FB' },
  quizOptionGood: { borderColor: '#00ADC1', backgroundColor: '#E0F7FA' },
  quizOptionBad: { borderColor: '#FF4444', backgroundColor: '#FFF0F0' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCCCCC', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  quizOptText: { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '500' },

  // ── Slide to Continue ──
  slideBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
    marginHorizontal: 16, marginBottom: 16, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#00ADC1',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  slideGrad: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  slideThumb: {
    width: 64, height: '100%', backgroundColor: '#89DFE9',
    justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: '#68C3D2',
  },
  slideHand: { width: 30, height: 30, tintColor: '#FFFFFF' },
  slideText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.4 },

  // ── Journey screen ──
  journeyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  journeyCard: {
    width: '100%', borderRadius: 24, padding: 30, alignItems: 'center', overflow: 'hidden',
    elevation: 6, shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    borderWidth: 1, borderColor: '#00ADC120',
  },
  journeyTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 6, letterSpacing: 0.2 },
  journeySub: { fontSize: 13, color: '#666', marginBottom: 32, textAlign: 'center' },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: 0, marginBottom: 36 },
  journeyStep: { alignItems: 'center', gap: 8 },
  journeyIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  journeyImg: { width: 44, height: 44 },
  journeyStepLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  journeyArrow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16 },
  arrowLine: { width: 30, height: 2, backgroundColor: '#00ADC1', marginRight: -2 },
  doneBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
});

export default NameDetailScreen;
