import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, Easing,
  Image, ImageBackground, TouchableOpacity, StatusBar, Pressable, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import NameDetailHeader from '../components/NameDetailHeader';

const { width: SW, height: SH } = Dimensions.get('window');

// Scale helpers — reference device: Redmi Note 13 Pro+ (≈393 × 900 dp)
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);
const hs = (n) => Math.round(n * hScale);

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
  const { markAsLearned, masteredIds } = useNames();
  const isMastered = masteredIds ? masteredIds.includes(name.number) : false;

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
  const scrollViewRef = useRef(null);

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

    let animSlice = [];
    let progressValue;
    if (stage === 1) {
      animSlice = sectionAnims.slice(0, 3);
      progressValue = 0.25;
    } else if (stage === 2) {
      animSlice = sectionAnims.slice(3, 4);
      progressValue = 0.50;
    } else if (stage === 3) {
      animSlice = sectionAnims.slice(4, 5);
      progressValue = 0.75;
    } else if (stage === 4) {
      animSlice = sectionAnims.slice(5, 6);
      progressValue = 1.0;
    }

    Animated.timing(progressAnim, {
      toValue: progressValue, duration: 1200, easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    Animated.stagger(
      150,
      animSlice.map(a =>
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 950, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(a.translateY, { toValue: 0, duration: 980, easing: Easing.out(Easing.back(2.05)), useNativeDriver: true }),
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
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } else if (contentStage === 2) {
      setContentStage(3);
      revealSections(3);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } else if (contentStage === 3) {
      setContentStage(4);
      revealSections(4);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } else if (contentStage === 4) {
      goJourney();
    }
  }, [contentStage, revealSections, goJourney]);

  // ── Physical Swiping Logic ──
  const slidePanX = useRef(new Animated.Value(0)).current;
  const slidePanResponder = useMemo(() => {
    const MAX_SLIDE = SW - rs(32) - rs(64);

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        handLoopRef.current?.stop();
        handAnim.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        let val = gestureState.dx;
        if (val < 0) val = 0;
        if (val > MAX_SLIDE) val = MAX_SLIDE;
        slidePanX.setValue(val);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > MAX_SLIDE * 0.7) {
          Animated.timing(slidePanX, {
            toValue: MAX_SLIDE,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            handleSlideTap();
            if (contentStage < 4) {
              Animated.spring(slidePanX, {
                toValue: 0,
                tension: 40,
                friction: 4,
                useNativeDriver: true,
              }).start(() => {
                handLoopRef.current?.start();
              });
            }
          });
        } else {
          Animated.spring(slidePanX, {
            toValue: 0,
            tension: 60,
            friction: 10,
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
          <NameDetailHeader name={name} onClose={() => navigation.goBack()} />

          <View style={styles.progressTrack} />

          <Animated.View style={[styles.giftBody, { opacity: giftOpacity }]}>
            <View style={styles.giftTopInfo}>
              <Text style={styles.giftTitle}>Gifts of this Name</Text>
              <View style={styles.giftSubtitleContainer}>
                <Text style={styles.giftSubtitle}>
                  What learning {name.transliteration} brings to your life
                </Text>
              </View>
            </View>

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
              <View style={styles.journeyStepCard}>
                <Image source={require('../../assets/mdi_learn-outline.png')} style={[styles.journeyImg, { tintColor: '#4CAF50' }]} resizeMode="contain" />
                <Text style={styles.journeyStepLabel}>Learned</Text>
              </View>

              <View style={styles.journeyLineWrap}>
                <View style={styles.journeyLineLeft} />
                <View style={styles.journeyLineRight} />
              </View>

              <View style={[styles.journeyStepCard, { opacity: isMastered ? 1 : 0.6 }]}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: rs(8), height: rs(44), width: rs(44) }}>
                  <Image source={isMastered ? require('../../assets/masterOpen.png') : require('../../assets/Masterlock.png')} style={{ width: rs(44), height: rs(44) }} resizeMode="contain" />
                  {!isMastered && <Ionicons name="lock-closed" size={rs(20)} color="#00ADC1" style={{ position: 'absolute', top: rs(12) }} />}
                </View>
                <Text style={styles.journeyStepLabel}>Mastered</Text>
              </View>
            </View>

            <Text style={styles.journeyNote}>
              {isMastered
                ? `You are the master of this journey!`
                : `If you read more than 3 times you will be master on this course`}
            </Text>

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
        <NameDetailHeader name={name} onClose={() => navigation.goBack()} />

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        <Animated.ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, opacity: contentOpacity }}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
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
            <ImageBackground
              source={require('../../assets/bgCard.png')}
              style={styles.divineCard}
              imageStyle={{ borderRadius: rs(16) }}
              resizeMode="cover"
            >
              <Text style={styles.divineName}>Divine Words</Text>
              <Text style={styles.divineSubtitle}>Qur'anic references to this name</Text>
              <View style={styles.quoteBlock}>
                <Image source={require('../../assets/quatation.png')} style={styles.quoteIconTop} resizeMode="contain" />
                <Text style={styles.quoteText}>
                  {quranicRef.translation || `In the name of Allah, the Most Gracious, the Most Merciful.`}
                </Text>
                <Image source={require('../../assets/quatation.png')} style={styles.quoteIconBottom} resizeMode="contain" />
              </View>
            </ImageBackground>
          </AnimSection>

          {/* ── Section 3: Ponder & Reflect ── */}
          <AnimSection anim={sectionAnims[3]} hidden={contentStage < 2}>
            <View style={styles.sectionCardTransparent}>
              <View style={styles.smallDividerWrap}>
                <Image source={require('../../assets/lineGold.png')} style={styles.smallDivider} resizeMode="contain" />
              </View>
              <Text style={styles.sectionCardTitleLeft}>Ponder & Reflect</Text>

              <ImageBackground
                source={require('../../assets/bgCard2.png')}
                style={styles.insightRow}
                imageStyle={{ borderRadius: rs(14) }}
                resizeMode="cover"
              >
                <Image source={require('../../assets/man.png')} style={styles.manImg} resizeMode="contain" />
                <View style={styles.insightBox}>
                  <Text style={styles.insightText}>
                    {reflection || `Every breath we take is a mercy from Ar-Rahman. He did not wait for us to ask- His mercy arrives before any deed of ours.`}
                  </Text>
                </View>
              </ImageBackground>
            </View>
          </AnimSection>

          {/* ── Section 4: Learning Insight ── */}
          <AnimSection anim={sectionAnims[4]} hidden={contentStage < 3}>
            <View style={styles.sectionCardTransparent}>
              <Text style={styles.sectionCardTitleLeft}>Learning Insight</Text>

              <ImageBackground
                source={require('../../assets/quest.png')}
                style={styles.questBgBox}
                resizeMode="contain"
              >
                <Text style={styles.questInsightText}>
                  {insight || `Ar-Rahman teaches that mercy precedes all worthiness. When you accept that grace finds you before you deserve it, you begin to live without shame and extend unconditional mercy to others.`}
                </Text>
              </ImageBackground>
            </View>
          </AnimSection>

          {/* ── Section 5: Quiz ── */}
          <AnimSection anim={sectionAnims[5]} hidden={contentStage < 4}>
            <View style={styles.quizSection}>
              <View style={styles.smallDividerWrap}>
                <Image source={require('../../assets/lineGold.png')} style={styles.smallDivider} resizeMode="contain" />
              </View>

              <View style={styles.quizHeader}>
                <View style={{ alignSelf: 'flex-start' }}>
                  <Text style={styles.quizTitle}>Match the Quality</Text>
                  <View style={styles.quizTitleUnderline} />
                </View>
                <Text style={styles.quizSubtitle}>
                  Test your understanding of <Text style={{ fontWeight: '800' }}>{name.transliteration}</Text>
                </Text>
              </View>

              <Text style={styles.quizQuestion}>{mcq.q}</Text>

              <View style={styles.quizOptions}>
                {mcq.opts.map((opt, idx) => {
                  const isSelected = quizAnswer === idx;
                  const isCorrect = idx === mcq.ans;
                  const showStatus = quizDone;

                  let borderColor = 'transparent';
                  let bgColor = '#FFFFFF';
                  let iconColor = '#00ADC1';
                  let textColor = '#1A1A1A';

                  if (showStatus) {
                    if (isSelected && isCorrect) {
                      borderColor = '#4CAF50'; bgColor = '#E8F5E9'; iconColor = '#4CAF50';
                    } else if (isSelected && !isCorrect) {
                      borderColor = '#F44336'; bgColor = '#FFEBEE'; iconColor = '#F44336';
                    } else if (isCorrect) {
                      borderColor = '#4CAF50'; bgColor = '#E8F5E9'; iconColor = '#4CAF50';
                    } else {
                      iconColor = '#ccc'; textColor = '#888';
                    }
                  } else if (isSelected) {
                    borderColor = '#00ADC1'; bgColor = '#F0FBFC';
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.quizOptionRow, { borderColor, backgroundColor: bgColor, borderWidth: showStatus || isSelected ? 1 : 0 }]}
                      onPress={() => handleQuizOption(idx)}
                      disabled={quizDone}
                    >
                      <View style={[styles.quizRadio, { borderColor: iconColor }]}>
                        {(showStatus ? (isSelected || isCorrect) : isSelected) && (
                          <View style={[styles.quizRadioInner, { backgroundColor: iconColor }]} />
                        )}
                      </View>
                      <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimSection>

          <View style={{ height: hs(100) }} />
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
            <Text style={[styles.slideText, { marginLeft: rs(80) }]}>
              {contentStage === 4 ? 'Continue to Journey' : 'Slide to Continue'}
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
  root: { flex: 1, backgroundColor: '#F0F2FB', borderTopLeftRadius: rs(36), borderTopRightRadius: rs(36), overflow: 'hidden' },

  // ── Gift phase ──
  giftBody: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: hs(50), paddingHorizontal: rs(24), zIndex: 1 },
  giftTopInfo: { alignItems: 'flex-start', marginTop: hs(10), width: '100%' },
  giftTitle: { fontSize: rs(24), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(4) },
  giftTitleScroll: { fontSize: rs(20), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(4), textAlign: 'center' },
  giftSubtitleContainer: { fontWeight: '100', paddingBottom: hs(2) },
  giftSubtitle: { fontSize: rs(14), color: '#000000ff', fontWeight: '500', lineHeight: rs(20) },
  giftSubtitleSmall: { fontSize: rs(13), color: '#7A7A7A', textAlign: 'center', marginBottom: hs(20), lineHeight: rs(19) },

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
    bottom: hs(85),
    width: SW * 0.5,
    height: hs(30),
    zIndex: -1,
  },

  doubleTapRow: { flexDirection: 'row', alignItems: 'center', gap: rs(25), bottom: hs(120) },
  handHint: { width: rs(32), height: rs(32), tintColor: '#00ADC1' },
  doubleTapText: { fontSize: rs(24), fontWeight: '500', color: '#00ADC1', letterSpacing: 0.5, },

  // ── Progress bar ──
  progressTrack: {
    height: hs(10),
    backgroundColor: '#E6E8F0',
    width: '80%',
    borderRadius: rs(20),
    alignSelf: 'center',
    marginVertical: hs(20),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#20B9CC',
    borderRadius: rs(20),
  },

  // ── Content scroll ──
  contentScroll: { paddingHorizontal: rs(20), paddingTop: hs(10), paddingBottom: hs(20) },
  animSection: { marginBottom: hs(18) },

  // ── Benefits ──
  benefitsList: { gap: hs(10) },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: rs(6),
    minHeight: hs(64),
    marginBottom: hs(12),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: rs(6),
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  benefitNumBadge: {
    width: rs(80),
    backgroundColor: '#4CD6E8',
    borderTopRightRadius: rs(6),
    borderBottomRightRadius: rs(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitNum: { fontSize: rs(18), fontWeight: '800', color: '#FFFFFF' },
  benefitText: {
    flex: 1,
    fontSize: rs(14),
    lineHeight: rs(22),
    color: '#1A1A1A',
    paddingHorizontal: rs(16),
    paddingVertical: hs(14),
    alignSelf: 'center',
  },

  // ── Gold divider ──
  dividerWrap: { alignItems: 'center', marginVertical: hs(16) },
  goldDivider: { width: rs(180), height: hs(20), opacity: 0.8 },

  // ── Divine Words card ──
  divineCard: {
    borderRadius: rs(16),
    padding: rs(24),
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#00ADC1',
    shadowOpacity: 0.15,
    shadowRadius: rs(15),
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  divineName: { fontSize: rs(18), fontWeight: '800', color: '#000000', textAlign: 'center', marginBottom: hs(3) },
  divineSubtitle: { fontSize: rs(12), color: '#4A4A4A', fontWeight: '400', textAlign: 'center', marginBottom: hs(16) },
  quoteBlock: { alignItems: 'center', position: 'relative' },
  quoteIconTop: { width: rs(32), height: hs(24), alignSelf: 'flex-start', marginBottom: hs(4) },
  quoteIconBottom: { width: rs(32), height: hs(24), alignSelf: 'flex-end', transform: [{ rotate: '180deg' }], marginTop: hs(4) },
  quoteText: { fontSize: rs(15), fontStyle: 'normal', color: '#1A1A1A', textAlign: 'center', lineHeight: rs(24) },

  // ── Generic section card ──
  sectionCardTransparent: { backgroundColor: 'transparent', paddingTop: hs(10), paddingBottom: hs(2), paddingHorizontal: rs(4) },
  sectionCardTitleLeft: { fontSize: rs(18), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(12), textAlign: 'left' },
  smallDividerWrap: { alignItems: 'center', marginBottom: hs(16) },
  smallDivider: { width: rs(140), height: hs(12), opacity: 0.6 },

  // ── Ponder Insight ──
  insightRow: { flexDirection: 'row', alignItems: 'center', borderRadius: rs(14), padding: rs(16), overflow: 'hidden' },
  manImg: { width: rs(68), height: rs(96), marginRight: rs(12) },
  insightBox: { flex: 1, justifyContent: 'center' },
  insightText: { fontSize: rs(13), color: '#1A1A1A', lineHeight: rs(20) },

  // ── Learning Insight (Quest) ──
  questBgBox: {
    width: SW * 0.95,
    alignSelf: 'center',
    aspectRatio: 1200 / 680,
    paddingLeft: '15%',
    paddingRight: '10%',
    paddingBottom: '2%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questInsightText: { fontSize: rs(15), color: '#1A1A1A', lineHeight: rs(25), textAlign: 'center', fontWeight: '400' },

  // ── Quiz Section ──
  quizSection: { paddingTop: hs(10), paddingHorizontal: rs(4) },
  quizHeader: { marginBottom: hs(20) },
  quizTitle: { fontSize: rs(20), fontWeight: '800', color: '#1A1A1A' },
  quizTitleUnderline: { height: 3, backgroundColor: '#00ADC1', width: '100%', marginTop: 2, borderRadius: 2 },
  quizSubtitle: { fontSize: rs(13), color: '#4A4A4A', marginTop: hs(8) },
  quizQuestion: { fontSize: rs(16), color: '#1A1A1A', fontWeight: '500', marginBottom: hs(16) },
  quizOptions: { gap: hs(12) },
  quizOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: rs(8),
    padding: rs(16),
    shadowColor: '#00ADC1',
    shadowOpacity: 0.05,
    shadowRadius: rs(8),
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  quizRadio: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: rs(12),
  },
  quizRadioInner: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  quizOptionText: { fontSize: rs(14) },

  // ── Slide to Continue ──
  slideBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: hs(56),
    marginHorizontal: rs(16), marginBottom: hs(16), borderRadius: rs(8), overflow: 'hidden',
    backgroundColor: '#00ADC1',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: rs(8), shadowOffset: { width: 0, height: 4 },
  },
  slideGrad: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  slideThumb: {
    width: rs(64), height: '100%', backgroundColor: '#89DFE9',
    justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: '#68C3D2',
  },
  slideHand: { width: rs(30), height: rs(30), tintColor: '#FFFFFF' },
  slideText: { fontSize: rs(16), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.4 },

  // ── Journey screen ──
  journeyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  journeyCard: {
    width: '100%', borderRadius: rs(16), paddingTop: hs(30), alignItems: 'center', overflow: 'hidden',
    elevation: 8, shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: rs(20), shadowOffset: { width: 0, height: 8 },
    backgroundColor: '#FFFFFF',
  },
  journeyTitle: { fontSize: rs(28), fontWeight: '900', color: '#4CD6E8', marginBottom: hs(6), letterSpacing: 0.2 },
  journeySub: { fontSize: rs(13), color: '#666', marginBottom: hs(36), textAlign: 'center' },
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: hs(40) },

  journeyStepCard: {
    width: rs(105), height: rs(105),
    backgroundColor: '#FFFFFF',
    borderRadius: rs(8),
    shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(10), shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 173, 193, 0.05)',
  },
  journeyImg: { width: rs(44), height: rs(44), marginBottom: hs(8) },
  journeyStepLabel: { fontSize: rs(12), fontWeight: '600', color: '#1A1A1A' },

  journeyLineWrap: { width: rs(60), height: 2, flexDirection: 'row' },
  journeyLineLeft: { flex: 1, backgroundColor: '#FFD54F' },
  journeyLineRight: { flex: 1, backgroundColor: '#00ADC1' },

  journeyNote: {
    fontSize: rs(13),
    color: '#7A7A7A',
    textAlign: 'center',
    paddingHorizontal: rs(30),
    marginBottom: hs(24),
    lineHeight: rs(20),
    marginTop: hs(-10),
  },

  doneBtn: { width: '100%', overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: hs(18), alignItems: 'center', backgroundColor: '#00ADC1' },
  doneBtnText: { fontSize: rs(18), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});

export default NameDetailScreen;
