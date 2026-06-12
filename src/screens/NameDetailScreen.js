import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, Easing,
  Image, TouchableOpacity, StatusBar, PanResponder, ScrollView, TextInput,
  LayoutAnimation, ImageBackground, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import NameDetailHeader from '../components/NameDetailHeader';
import TimeBasedBackground from '../components/TimeBasedBackground';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);
const hs = (n) => Math.round(n * hScale);

const NameDetailScreen = ({ route, navigation }) => {
  const { name, initialStepIndex = 0 } = route.params;
  const { markAsLearned, masteredIds, revisitCounts, userReflections } = useNames();
  const { isDark } = useAppTheme();
  const isMastered = masteredIds ? masteredIds.includes(name.id) : false;
  const revisits = revisitCounts[name.id] || 0;
  const isSaturated = isMastered || revisits >= 3;

  // Night-mode themed colors
  const t = useMemo(() => isDark ? {
    cardBg: '#1A2332',
    cardBorder: 'rgba(0,173,193,0.20)',
    text: '#E8EDF2',
    subText: '#9EAAB8',
    dimText: '#6B7A8D',
    inputBg: '#0F1923',
    inputBorder: 'rgba(0,173,193,0.30)',
    safeBg: '#0F172A',
    progressTrack: '#1E293B',
    pillText: '#C5F2F7',
    optionBg: '#1A2332',
    notebookLeft: '#142030',
    notebookBorder: 'rgba(0,173,193,0.25)',
    ringHole: '#0F1923',
    pastBg: 'rgba(0,173,193,0.12)',
    journeyCardBg: '#1A2332',
    journeyGrad: ['#0F172A', '#1A2332'],
    statusBg: '#1A2332',
  } : {
    cardBg: '#FFFFFF',
    cardBorder: '#DFF6F8',
    text: '#1A1A1A',
    subText: '#3A3A3A',
    dimText: '#7A7A7A',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(0,173,193,0.25)',
    safeBg: '#C5F2F7',
    progressTrack: '#FFFFFF',
    pillText: '#1A1A1A',
    optionBg: '#FFFFFF',
    notebookLeft: '#F0FAFC',
    notebookBorder: '#A0E4EC',
    ringHole: '#FFFFFF',
    pastBg: 'rgba(0,173,193,0.07)',
    journeyCardBg: '#FFFFFF',
    journeyGrad: ['#E8F7FB', '#FFFFFF'],
    statusBg: '#FFFFFF',
  }, [isDark]);

  // Determine if this is a Qur'anic name or Sunnah name
  // The first 81 are Qur'anic, the last 18 are Sunnah. We can also check if quranic array exists and has items.
  const isSunnah = name.sunnah && name.sunnah.length > 0 && (!name.quranic || name.quranic.length === 0);
  const categoryPillText = isSunnah ? 'Sunnah' : "Qur'anic";

  // Build the dynamic steps array
  const steps = useMemo(() => {
    const s = [];    // 1. Meaning Step
    s.push({ type: 'meaning' });

    // 2. Reference Steps
    // Prefer the new Prisma 'quran' array format which has rich data
    if (name.quran && name.quran.length > 0) {
      name.quran.forEach((ref, index) => {
        s.push({
          type: 'reference',
          data: {
            arabic: ref.ar,
            simpleMeaning: ref.tr,
            reference: ref.ref,
            significance: ref.significance
          },
          index
        });
      });
    } else {
      // Fallback to legacy arrays if 'quran' is empty
      const isSunnah = name.category === 'sunnah' || name.cat === 'sunnah';
      const references = isSunnah ? name.sunnah : name.quranic;
      if (references && references.length > 0) {
        references.forEach((ref, index) => {
          s.push({ type: 'reference', data: ref, index });
        });
      }
    }

    // 3. Gifts Step
    if (name.gifts && name.gifts.length > 0) {
      s.push({ type: 'gifts' });
    }
    if (name.practicalWays && name.practicalWays.length > 0) {
      s.push({ type: 'practical' });
    }
    if (name.scholarlyViews && name.scholarlyViews.length > 0) {
      s.push({ type: 'scholarly' });
    }

    if (revisits < 2 && !isSaturated) {
      s.push({ type: 'reflection' });
    } else {
      s.push({ type: 'mastery' });
    }

    return s;
  }, [name, isSunnah, revisits, isSaturated]);

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const clamped = Math.max(0, Math.min(initialStepIndex, steps.length - 1));
    return clamped;
  });
  const [phase, setPhase] = useState('content'); // 'content' | 'journey'
  const [masteryAnswer, setMasteryAnswer] = useState(null);
  const [masteryDone, setMasteryDone] = useState(false);
  const [refSubStep, setRefSubStep] = useState(0);
  const [giftSubStep, setGiftSubStep] = useState(0);
  const [practicalSubStep, setPracticalSubStep] = useState(0);
  const [scholarSubStep, setScholarSubStep] = useState(0);

  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const [reflectionSubStep, setReflectionSubStep] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef(null);

  // Persist reading position so "Back to Reading" can resume here
  useEffect(() => {
    AsyncStorage.setItem('last_reading_progress', JSON.stringify({
      nameNumber: name.number || name.id,
      stepIndex: currentStepIndex,
    })).catch(() => { });
  }, [currentStepIndex, name]);

  const currentStep = steps[currentStepIndex];
  const progress = (currentStepIndex + 1) / steps.length;

  const isSlideDisabled = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.type === 'mastery') {
      const correctAns = name.mcq && name.mcq.length > 0 ? name.mcq[0].ans : 0;
      return !masteryDone || masteryAnswer !== correctAns;
    }
    if (currentStep.type === 'reflection') {
      const countWords = (text) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
      return countWords(reflection1) < 4 || countWords(reflection2) < 4 || countWords(reflection3) < 4;
    }
    return false;
  }, [currentStep, masteryDone, masteryAnswer, name.mcq, reflection1, reflection2, reflection3]);

  // Animations
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const slidePanX = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const slideBtnScale = useRef(new Animated.Value(1)).current;
  const handLoopRef = useRef(null);

  const journeyOpacity = useRef(new Animated.Value(0)).current;
  const journeyTranslate = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
  }, [handAnim]);

  // Smoothly scroll to active reflection input when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      if (currentStep?.type === 'reflection') {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    });

    const subHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [currentStep]);

  const goToStep = useCallback((index) => {
    if (index < 0 || index >= steps.length) return;
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 10, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStepIndex(index);
      setRefSubStep(0);
      setGiftSubStep(0);
      setPracticalSubStep(0);
      setScholarSubStep(0);
      setReflection1('');
      setReflection2('');
      setReflection3('');
      setReflectionSubStep(0);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 250, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]).start();
    });
  }, [steps.length, contentOpacity, contentTranslateY]);

  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  }, [currentStepIndex, steps.length, goToStep]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const goJourney = useCallback((reflectionData = null) => {
    markAsLearned(name.id, reflectionData);
    AsyncStorage.removeItem('last_reading_progress').catch(() => { });
    setPhase('journey');
    Animated.parallel([
      Animated.timing(journeyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(journeyTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [markAsLearned, name.id, journeyOpacity, journeyTranslate]);

  const handleSlideTap = useCallback(() => {
    Animated.sequence([
      Animated.timing(slideBtnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(slideBtnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      let ans = 0;
      if (name.mcq && name.mcq.length > 0) ans = name.mcq[0].ans;

      if (currentStep.type === 'mastery') {
        if (masteryDone && masteryAnswer === ans) {
          goJourney();
        }
      } else if (currentStep.type === 'reflection') {
        goJourney({
          q1: reflection1,
          q2: reflection2,
          q3: reflection3
        });
      } else if (currentStep.type === 'reference') {
        let maxSubSteps = 0;
        if (currentStep.data.simpleMeaning) maxSubSteps++;
        if (currentStep.data.significance) maxSubSteps++;

        if (refSubStep < maxSubSteps) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setRefSubStep(prev => prev + 1);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        } else {
          goNext();
        }
      } else if (currentStep.type === 'gifts') {
        const maxSubSteps = name.gifts ? name.gifts.length - 1 : 0;
        if (giftSubStep < maxSubSteps) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setGiftSubStep(prev => prev + 1);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        } else {
          goNext();
        }
      } else if (currentStep.type === 'practical') {
        const maxSubSteps = name.practicalWays ? name.practicalWays.length - 1 : 0;
        if (practicalSubStep < maxSubSteps) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPracticalSubStep(prev => prev + 1);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        } else {
          goNext();
        }
      } else if (currentStep.type === 'scholarly') {
        const maxSubSteps = name.scholarlyViews ? name.scholarlyViews.length - 1 : 0;
        if (scholarSubStep < maxSubSteps) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setScholarSubStep(prev => prev + 1);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 50);
        } else {
          goNext();
        }
      } else {
        goNext();
      }
    });
  }, [goJourney, slideBtnScale, currentStep.type, masteryDone, masteryAnswer, name.mcq, goNext, currentStep.data, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, name.gifts, name.practicalWays, name.scholarlyViews, reflection1, reflection2, reflection3]);

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
            Animated.timing(slidePanX, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start(() => {
              handLoopRef.current?.start();
            });
          });
        } else {
          Animated.timing(slidePanX, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            handLoopRef.current?.start();
          });
        }
      }
    });
  }, [handleSlideTap, handAnim, slidePanX]);

  // ── Render Helpers ──

  const renderMeaning = () => {
    // Extract the long description text.
    // In the new schema, name.meaning is usually the short translation (e.g. "The One"),
    // and name.description contains the long text.
    let displayMeaning = name.description || name.meaning || '';

    if (typeof displayMeaning === 'string' && displayMeaning.includes('—')) {
      displayMeaning = displayMeaning.split('—')[1].trim();
    }

    return (
      <View style={styles.tabContentContainer}>
        <View style={styles.meaningCardWrap}>
          <View style={[styles.meaningCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <Text style={[styles.meaningText, { color: t.text }]}>{displayMeaning}</Text>
          </View>
          <View style={styles.meaningBadge}>
            <LinearGradient colors={['#00ADC1', '#0090A8']} style={styles.meaningBadgeGrad}>
              <Text style={styles.meaningBadgeText}>Meaning</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  const renderReference = (refData) => {
    const hasSimple = !!refData.simpleMeaning;
    const hasSig = !!refData.significance;

    const showSimple = hasSimple && refSubStep >= 1;
    const showSig = hasSig && (hasSimple ? refSubStep >= 2 : refSubStep >= 1);

    return (
      <View style={styles.tabContentContainer}>
        <View style={[styles.refCard, { backgroundColor: t.cardBg }]}>
          <Text style={[styles.refArabic, { color: t.text }]}>{refData.arabic}</Text>
          {refData.reference && <Text style={[styles.refLabel, { color: t.subText }]}>{refData.reference}</Text>}
        </View>

        {showSimple && (
          <View style={styles.fadeInBlock}>
            <View style={styles.refDividerWrap}>
              <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
            </View>

            <Text style={[styles.sectionTitle, { color: t.text }]}>Simple Meaning</Text>
            <Text style={[styles.refSimpleMeaning, { color: t.subText }]}>{refData.simpleMeaning}</Text>
          </View>
        )}

        {showSig && (
          <View style={styles.fadeInBlock}>
            <View style={[styles.refDividerWrap, { marginVertical: hs(24) }]}>
              <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Significance of the Name</Text>
            <Text style={[styles.refSignificance, { color: t.subText }]}>{refData.significance}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderGifts = () => (
    <View style={styles.tabContentContainer}>
      {name.gifts?.slice(0, giftSubStep + 1).map((gift, i) => (
        <View key={i}>
          <View style={[styles.giftCardContainer, { backgroundColor: t.cardBg }]}>
            <View style={styles.giftCardInner}>
              <View style={styles.giftLeft}>
                <Text style={[styles.giftLeftLabel, { color: t.text }]}>Spiritual{'\n'}benefit</Text>
                <View style={styles.giftArch}>
                  <View style={styles.giftNumCircle}>
                    <Text style={styles.giftNumText}>{String(i + 1).padStart(2, '0')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.giftDivider} />
              <View style={styles.giftRight}>
                <Text style={[styles.giftText, { color: t.subText }]}>{gift}</Text>
              </View>
            </View>
          </View>
          {i < giftSubStep && (
            <View style={styles.refDividerWrap}>
              <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const getPracticalIcon = (title) => {
    if (title.includes('DAILY')) return 'calendar-outline';
    if (title.includes('WORSHIP')) return 'moon-outline';
    if (title.includes('CHARACTER')) return 'person-outline';
    if (title.includes('REFLECTION')) return 'shield-outline';
    return 'shield-outline';
  };

  const renderPractical = () => (
    <View style={styles.tabContentContainer}>
      {name.practicalWays?.slice(0, practicalSubStep + 1).map((way, i) => {
        let title = "ACTION";
        let text = way;
        if (i === 0) title = "DAILY ACTION";
        else if (i === 1) title = "WORSHIP ACTION";
        else if (i === 2) title = "CHARACTER ACTION";
        else if (i === 3) title = "REFLECTION ACTION";

        return (
          <View key={i}>
            <View style={[styles.practicalCardContainer, { backgroundColor: t.cardBg }]}>
              <View style={[styles.practicalCardInner, { borderColor: t.notebookBorder }]}>
                <View style={[styles.practicalLeftCol, { backgroundColor: t.notebookLeft, borderRightColor: t.notebookBorder }]}>
                  <Ionicons name={getPracticalIcon(title)} size={rs(28)} color="#00ADC1" />
                </View>
                <View style={styles.notebookRings}>
                  {[...Array(6)].map((_, j) => (
                    <View key={j} style={styles.ringWrap}>
                      <View style={[styles.ringHoleLeft, { backgroundColor: t.ringHole }]} />
                      <View style={[styles.ringHoleRight, { backgroundColor: t.ringHole }]} />
                      <View style={styles.ringMetal} />
                    </View>
                  ))}
                </View>
                <View style={[styles.practicalContent, { backgroundColor: t.cardBg }]}>
                  <Text style={[styles.practicalTitle, { color: t.text }]}>{title}</Text>
                  <Text style={[styles.practicalText, { color: t.subText }]}>{text}</Text>
                </View>
              </View>
            </View>
            {i < practicalSubStep && (
              <View style={styles.refDividerWrap}>
                <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderScholarly = () => (
    <View style={styles.tabContentContainer}>
      {name.scholarlyViews?.slice(0, scholarSubStep + 1).map((view, i) => (
        <View key={i}>
          {isDark ? (
            <View style={[styles.scholarCard, { backgroundColor: '#1A2332', borderWidth: 1, borderColor: 'rgba(0,173,193,0.20)', borderRadius: rs(12) }]}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: rs(12), borderTopRightRadius: rs(12), backgroundColor: '#00ADC1' }} />
              <Text style={[styles.scholarName, { color: '#E8EDF2' }]}>{view.scholar}</Text>
              <Text style={[styles.scholarWork, { color: '#00ADC1' }]}>{view.work?.replace(/\*/g, '')}</Text>
              <Text style={[styles.scholarQuote, { color: '#B0BEC5' }]}>"{view.view}"</Text>
            </View>
          ) : (
            <ImageBackground source={require('../../assets/name_detail/bg_card.png')} style={styles.scholarCard} imageStyle={{ borderRadius: rs(12) }} resizeMode="cover">
              <Text style={[styles.scholarName, { color: '#1A1A1A' }]}>{view.scholar}</Text>
              <Text style={[styles.scholarWork, { color: '#1A1A1A' }]}>{view.work?.replace(/\*/g, '')}</Text>
              <Text style={[styles.scholarQuote, { color: '#3A3A3A' }]}>"{view.view}"</Text>
            </ImageBackground>
          )}
          {i < scholarSubStep && (
            <View style={styles.refDividerWrap}>
              <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderReflection = () => {
    const pastReflections = revisits === 1 ? userReflections[name.id] : null;
    const countWords = (t) => t.trim().split(/\s+/).filter(w => w.length > 0).length;

    const questions = [
      { key: 'q1', label: 'What does this Name teach me about Allah?', value: reflection1, setter: setReflection1, past: pastReflections?.q1 },
      { key: 'q2', label: 'How should this Name change my worship?', value: reflection2, setter: setReflection2, past: pastReflections?.q2 },
      { key: 'q3', label: 'Where do I need this Name in my life today?', value: reflection3, setter: setReflection3, past: pastReflections?.q3 },
    ];

    const visible = questions.slice(0, reflectionSubStep + 1);

    return (
      <View style={styles.tabContentContainer}>
        {visible.map((q, i) => {
          const isCurrentActive = i === reflectionSubStep;
          const isLast = i === questions.length - 1;
          const hasEnough = countWords(q.value) >= 4;

          return (
            <View key={q.key}>
              <View style={[styles.reflectionCard, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
                <View style={styles.reflectionCardHeader}>
                  <LinearGradient colors={['#00ADC1', '#0090A8']} style={styles.reflectionNumBadge}>
                    <Text style={styles.reflectionNum}>{String(i + 1).padStart(2, '0')}</Text>
                  </LinearGradient>
                  <Text style={[styles.reflectionQuestion, { color: t.text }]}>{q.label}</Text>
                </View>

                <View style={[styles.reflectionInputWrap, { borderBottomColor: t.inputBorder }]}>
                  <TextInput
                    style={[styles.reflectionInputPremium, { color: t.text }]}
                    multiline
                    placeholder="Minimum 4 words..."
                    placeholderTextColor="rgba(0,173,193,0.45)"
                    value={q.value}
                    onChangeText={q.setter}
                  />
                </View>

                {q.past ? (
                  <View style={[styles.pastReflectionWrap, { backgroundColor: t.pastBg }]}>
                    <Text style={styles.pastReflectionLabel}>Previous reflection</Text>
                    <Text style={[styles.pastReflectionText, { color: t.subText }]}>{q.past}</Text>
                  </View>
                ) : null}

                {/* "Next question" button — only on the active card, not on the last */}
                {isCurrentActive && !isLast && (
                  <TouchableOpacity
                    style={[styles.reflectionNextBtn, !hasEnough && styles.reflectionNextBtnDisabled]}
                    activeOpacity={hasEnough ? 0.8 : 1}
                    onPress={() => {
                      if (!hasEnough) return;
                      Keyboard.dismiss();
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setReflectionSubStep(prev => prev + 1);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                        // Re-focus after scroll settles
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }, 150);
                    }}
                  >
                    <Text style={[styles.reflectionNextBtnText, !hasEnough && { color: '#AAAAAA' }]}>
                      Next question
                    </Text>
                    <Ionicons name="chevron-forward" size={rs(14)} color={hasEnough ? '#FFFFFF' : '#AAAAAA'} />
                  </TouchableOpacity>
                )}
              </View>

              {i < reflectionSubStep && (
                <View style={styles.refDividerWrap}>
                  <Image source={require('../../assets/name_detail/line_gold.png')} style={styles.goldDivider} resizeMode="contain" />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderMastery = () => {
    let mcq = name.mcq && name.mcq.length > 0 ? name.mcq[0] : null;
    if (!mcq) {
      mcq = {
        q: `What does ${name.tr} mean?`,
        opts: [name.en, 'The Most Merciful', 'The Provider', 'The Judge'],
        ans: 0
      };
    }

    return (
      <View style={styles.tabContentContainer}>
        <Text style={[styles.quizQuestion, { color: t.text }]}>{mcq.q}</Text>

        <View style={styles.quizOptions}>
          {mcq.opts.map((opt, idx) => {
            const isSelected = masteryAnswer === idx;
            const isCorrect = idx === mcq.ans;
            const showStatus = masteryDone;

            let borderColor = 'transparent';
            let bgColor = t.optionBg;
            let iconColor = '#00ADC1';

            if (showStatus) {
              if (isSelected && isCorrect) {
                borderColor = '#4CAF50';
              } else if (isSelected && !isCorrect) {
                borderColor = '#F44336';
              } else if (isCorrect) {
                borderColor = '#4CAF50';
              } else {
                iconColor = '#ccc';
              }
            } else if (isSelected) {
              borderColor = '#00ADC1';
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.quizOptionRow, { borderColor, backgroundColor: bgColor, borderWidth: (showStatus && (isSelected || isCorrect)) || isSelected ? 1 : 0 }]}
                onPress={() => {
                  if (masteryDone) return;
                  setMasteryAnswer(idx);
                  setMasteryDone(true);
                }}
                disabled={masteryDone}
              >
                <View style={[styles.quizRadio, { borderColor: iconColor }]}>
                  {(showStatus ? (isSelected || isCorrect) : isSelected) && (
                    <View style={[styles.quizRadioInner, { backgroundColor: iconColor }]} />
                  )}
                </View>
                <Text style={[styles.quizOptionText, { color: t.text }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {masteryDone && (
          <View style={{ marginTop: hs(24), width: '100%', gap: hs(12) }}>
            {masteryAnswer !== mcq.ans && (
              <View style={[styles.statusBanner, { borderColor: '#F44336', backgroundColor: t.statusBg }]}>
                <View style={[styles.statusIconWrap, { backgroundColor: '#F44336' }]}>
                  <Ionicons name="close" size={rs(16)} color="#FFF" />
                </View>
                <Text style={[styles.statusText, { color: '#F44336' }]}>Wrong Answer</Text>
              </View>
            )}
            <View style={[styles.statusBanner, { borderColor: '#4CAF50', backgroundColor: t.statusBg }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark" size={rs(16)} color="#FFF" />
              </View>
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Correct Answer</Text>
            </View>
            {masteryAnswer !== mcq.ans && (
              <TouchableOpacity
                style={styles.tryAgainBtn}
                onPress={() => { setMasteryAnswer(null); setMasteryDone(false); }}
              >
                <Text style={styles.tryAgainText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ── Render ──

  if (phase === 'journey') {
    const MASTERY_THRESHOLD = 3;
    const completedReads = revisits + 1; // this session just counted
    const remaining = Math.max(0, MASTERY_THRESHOLD - completedReads);

    const journeyNote = isMastered
      ? 'You are the master of this journey!'
      : remaining === 1
        ? `Read this name 1 more time to unlock Mastered.`
        : `Read this name ${remaining} more times to unlock Mastered.`;

    return (
      <View style={styles.root}>
        <TimeBasedBackground showElements={false}>
          {({ isNight }) => (
            <>
              <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
              <SafeAreaView style={styles.journeyRoot} edges={['top']}>
                <Animated.View style={[styles.journeyCard, { opacity: journeyOpacity, transform: [{ translateY: journeyTranslate }], backgroundColor: t.journeyCardBg }]}>
                  <LinearGradient colors={t.journeyGrad} style={StyleSheet.absoluteFillObject} />
                  <Text style={styles.journeyTitle}>Your Journey</Text>
                  <Text style={[styles.journeySub, { color: t.dimText }]}>Track your mastery of {name.tr}</Text>

                  <View style={styles.journeyRow}>
                    <View style={[styles.journeyStepCard, { backgroundColor: t.cardBg }]}>
                      <Image source={require('../../assets/name_detail/mdi_learn_outline.png')} style={[styles.journeyImg, { tintColor: '#4CAF50' }]} resizeMode="contain" />
                      <Text style={[styles.journeyStepLabel, { color: t.text }]}>Learned</Text>
                    </View>

                    <View style={styles.journeyLineWrap}>
                      <View style={styles.journeyLineLeft} />
                      <View style={styles.journeyLineRight} />
                    </View>

                    <View style={[styles.journeyStepCard, { opacity: isMastered ? 1 : 0.6, backgroundColor: t.cardBg }]}>
                      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: rs(8), height: rs(44), width: rs(44) }}>
                        <Image source={isMastered ? require('../../assets/name_detail/master_open.png') : require('../../assets/name_detail/master_lock.png')} style={{ width: rs(44), height: rs(44) }} resizeMode="contain" />
                        {!isMastered && <Ionicons name="lock-closed" size={rs(20)} color="#00ADC1" style={{ position: 'absolute', top: rs(12) }} />}
                      </View>
                      <Text style={[styles.journeyStepLabel, { color: t.text }]}>Mastered</Text>
                    </View>
                  </View>

                  {/* Read progress dots */}
                  {!isMastered && (
                    <View style={styles.journeyProgressRow}>
                      {Array.from({ length: MASTERY_THRESHOLD }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.journeyDot,
                            i < completedReads ? styles.journeyDotFilled : styles.journeyDotEmpty,
                          ]}
                        />
                      ))}
                      <Text style={styles.journeyProgressLabel}>
                        {completedReads}/{MASTERY_THRESHOLD} reads
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.journeyNote, { color: t.dimText }]}>{journeyNote}</Text>

                  <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                    <LinearGradient colors={['#00ADC1', '#0090A8']} style={styles.doneBtnGrad}>
                      <Text style={styles.doneBtnText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </SafeAreaView>
            </>
          )}
        </TimeBasedBackground>
      </View>
    );
  }

  const handX = handAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <View style={styles.root}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <SafeAreaView style={{ flex: 1, backgroundColor: t.safeBg }} edges={['top']}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <NameDetailHeader name={name} onClose={() => navigation.goBack()} />

                {/* ── Progress Bar & Navigation ── */}
                <View style={styles.navSection}>
                  <View style={styles.progressWrap}>
                    <View style={[styles.progressTrack, { backgroundColor: t.progressTrack }]}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                  </View>

                  <View style={styles.navRow}>
                    <LinearGradient
                      colors={['rgba(0,173,193,0)', 'rgba(0,173,193,0.5)', 'rgba(0,173,193,0)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.categoryPill}
                    >
                      <Text style={[styles.categoryPillText, { color: t.pillText }]}>{categoryPillText}</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* ── Fixed Main Title ── */}
                {(() => {
                  let stepTitle = null;
                  if (currentStep.type === 'gifts') stepTitle = 'The Gift of This Name';
                  else if (currentStep.type === 'practical') stepTitle = 'Practical ways to live with this Name';
                  else if (currentStep.type === 'scholarly') stepTitle = 'Scholarly Views';
                  else if (currentStep.type === 'reflection') stepTitle = 'Reflection';
                  else if (currentStep.type === 'mastery') stepTitle = 'Mastery Test';

                  if (!stepTitle) return null;
                  return (
                    <Animated.View style={{ opacity: contentOpacity, paddingHorizontal: rs(20), marginBottom: hs(12) }}>
                      <Text style={[styles.mainTitle, { marginBottom: 0, color: t.text }]}>{stepTitle}</Text>
                    </Animated.View>
                  );
                })()}

                <ScrollView ref={scrollViewRef} style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
                    {currentStep.type === 'meaning' && renderMeaning()}
                    {currentStep.type === 'reference' && renderReference(currentStep.data)}
                    {currentStep.type === 'gifts' && renderGifts()}
                    {currentStep.type === 'practical' && renderPractical()}
                    {currentStep.type === 'scholarly' && renderScholarly()}
                    {currentStep.type === 'reflection' && renderReflection()}
                    {currentStep.type === 'mastery' && renderMastery()}
                  </Animated.View>
                  <View style={{ height: (currentStep.type === 'reflection' ? hs(220) : hs(120)) + (keyboardHeight > 0 ? keyboardHeight * 0.5 : 0) }} />
                </ScrollView>

                {/* ── Previous step button ── */}
                {currentStepIndex > 0 &&
                  currentStep.type !== 'reflection' &&
                  currentStep.type !== 'mastery' && (
                    <TouchableOpacity
                      style={styles.prevBtn}
                      onPress={goPrev}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back" size={rs(15)} color="#00ADC1" />
                      <Text style={styles.prevBtnText}>Previous</Text>
                    </TouchableOpacity>
                  )}

                {/* ── Fixed bottom: Slide to Continue ── */}
                <Animated.View
                  style={[
                    styles.slideBar,
                    { transform: [{ scale: slideBtnScale }] },
                    isSlideDisabled && { opacity: 0.6 },
                    isDark && { backgroundColor: '#1E293B', shadowColor: '#0F172A' }
                  ]}
                >
                  <View style={styles.slideGrad}>
                    <Animated.View
                      {...(!isSlideDisabled ? slidePanResponder.panHandlers : {})}
                      style={[
                        styles.slideThumb,
                        { position: 'absolute', left: 0, zIndex: 10 },
                        { transform: [{ translateX: slidePanX }] },
                        isDark && { backgroundColor: '#0F172A', borderRightColor: '#334155' }
                      ]}
                    >
                      <Animated.Image
                        source={require('../../assets/name_detail/sign_hand.png')}
                        style={[styles.slideHand, { transform: [{ translateX: handX }] }]}
                        resizeMode="contain"
                      />
                    </Animated.View>
                    <Text style={[styles.slideText, { marginLeft: rs(80) }]}>
                      Slide to Continue
                    </Text>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </>
        )}
      </TimeBasedBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent', borderTopLeftRadius: rs(36), borderTopRightRadius: rs(36), overflow: 'hidden' },

  // ── Navigation ──
  navSection: { marginTop: hs(16), marginBottom: hs(24), alignItems: 'center' },
  progressWrap: { width: '85%', marginBottom: hs(24) },
  progressTrack: { height: hs(14), backgroundColor: '#FFFFFF', borderRadius: rs(20), width: '100%', shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  progressFill: { height: '100%', backgroundColor: '#00ADC1', borderRadius: rs(20) },
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  categoryPill: { paddingHorizontal: rs(40), paddingVertical: hs(4), justifyContent: 'center', alignItems: 'center' },
  categoryPillText: { fontSize: rs(14), fontWeight: '900', color: '#1A1A1A' },

  // ── Content ──
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: rs(20), paddingTop: hs(10) },
  tabContentContainer: { width: '100%' },
  mainTitle: { fontSize: rs(20), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(24) },
  sectionTitle: { fontSize: rs(18), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(12) },

  // ── Meaning Card ──
  meaningCardWrap: { alignItems: 'center', marginTop: hs(20) },
  meaningCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: rs(12), padding: rs(24), paddingTop: hs(40), paddingBottom: hs(40), shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: rs(15), shadowOffset: { width: 0, height: 8 }, elevation: 5, borderWidth: 1, borderColor: '#DFF6F8' },
  meaningText: { fontSize: rs(16), color: '#1A1A1A', textAlign: 'center', lineHeight: rs(24), fontWeight: '700' },
  meaningBadge: { position: 'absolute', top: hs(-18), borderRadius: rs(6), overflow: 'hidden', shadowColor: '#00ADC1', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 6, borderWidth: 1, borderColor: '#4CD6E8' },
  meaningBadgeGrad: { paddingHorizontal: rs(32), paddingVertical: hs(8) },
  meaningBadgeText: { color: '#FFFFFF', fontSize: rs(18), fontWeight: 'bold', textAlign: 'center' },

  // ── Reference Card ──
  refCard: { backgroundColor: '#FFFFFF', borderTopRightRadius: rs(8), borderBottomRightRadius: rs(8), borderTopLeftRadius: rs(4), borderBottomLeftRadius: rs(4), borderLeftWidth: rs(6), borderLeftColor: '#00ADC1', borderWidth: 1, borderColor: '#00ADC1', padding: rs(16), paddingBottom: hs(40), shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(8), shadowOffset: { width: 0, height: 4 }, elevation: 3, position: 'relative', overflow: 'hidden' },
  refArabic: { fontSize: rs(22), fontWeight: '700', color: '#1A1A1A', textAlign: 'justify', lineHeight: rs(40), writingDirection: 'rtl', marginBottom: hs(16), zIndex: 2 },
  refLabel: { position: 'absolute', bottom: hs(12), left: rs(16), fontSize: rs(13), color: '#1A1A1A', fontWeight: '800', zIndex: 2 },
  refSplatter: { position: 'absolute', bottom: hs(-10), right: rs(-10), width: rs(80), height: rs(80), opacity: 0.15, zIndex: 1 },
  refSimpleMeaning: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refSignificance: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refDividerWrap: { alignItems: 'center', marginVertical: hs(20) },
  goldDivider: { width: rs(140), height: hs(12), opacity: 0.9 },
  fadeInBlock: { width: '100%' },

  // ── Gifts Card ──
  giftCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(8), shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(8), shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: hs(4) },
  giftCardInner: { flexDirection: 'row', borderRadius: rs(8), overflow: 'hidden' },
  giftLeft: { width: rs(90), alignItems: 'center', paddingTop: hs(16), justifyContent: 'space-between' },
  giftLeftLabel: { fontSize: rs(12), color: '#1A1A1A', textAlign: 'center', fontWeight: '800', lineHeight: rs(14), marginBottom: hs(12) },
  giftArch: { width: rs(44), height: hs(48), backgroundColor: '#13BCCF', borderTopLeftRadius: rs(22), borderTopRightRadius: rs(22), justifyContent: 'center', alignItems: 'center' },
  giftNumCircle: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  giftNumText: { color: '#1A1A1A', fontSize: rs(14), fontWeight: '900' },
  giftDivider: { width: 1, backgroundColor: '#00ADC1', opacity: 0.2, marginVertical: hs(16) },
  giftRight: { flex: 1, padding: rs(16), justifyContent: 'center' },
  giftText: { fontSize: rs(13), color: '#1A1A1A', lineHeight: rs(20) },

  // ── Practical Card ──
  practicalCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(4), shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(8), shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: hs(4) },
  practicalCardInner: { flexDirection: 'row', borderRadius: rs(4), overflow: 'hidden', borderWidth: 1, borderColor: '#A0E4EC', position: 'relative' },
  practicalLeftCol: { width: rs(64), backgroundColor: '#F0FAFC', borderRightWidth: 1, borderRightColor: '#A0E4EC', justifyContent: 'center', alignItems: 'center', paddingVertical: hs(20) },
  notebookRings: { position: 'absolute', left: rs(64) - rs(12), width: rs(24), height: '100%', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: hs(12), zIndex: 2 },
  ringWrap: { width: '100%', height: hs(12), position: 'relative', justifyContent: 'center', alignItems: 'center' },
  ringHoleLeft: { position: 'absolute', left: rs(2), width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D0D0' },
  ringHoleRight: { position: 'absolute', right: rs(2), width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#D0D0D0' },
  ringMetal: { position: 'absolute', width: rs(14), height: hs(4), backgroundColor: '#00ADC1', borderRadius: rs(2) },
  practicalContent: { flex: 1, padding: rs(16), backgroundColor: '#FFFFFF', justifyContent: 'center' },
  practicalTitle: { fontSize: rs(12), fontWeight: '800', color: '#1A1A1A', letterSpacing: 2, marginBottom: hs(12) },
  practicalText: { fontSize: rs(13), color: '#3A3A3A', lineHeight: rs(20) },

  // ── Scholarly Card ──
  scholarCard: { borderRadius: rs(12), padding: rs(24), shadowColor: '#D4AF37', shadowOpacity: 0.2, shadowRadius: rs(12), shadowOffset: { width: 0, height: 6 }, elevation: 4, alignItems: 'center' },
  scholarName: { fontSize: rs(20), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(4) },
  scholarWork: { fontSize: rs(13), fontWeight: '700', color: '#1A1A1A', marginBottom: hs(16) },
  scholarQuote: { fontSize: rs(13), color: '#3A3A3A', fontStyle: 'italic', textAlign: 'center', lineHeight: rs(20) },

  // ── Reflection Cards (premium) ──
  reflectionCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(14), shadowOffset: { width: 0, height: 5 }, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
  reflectionCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(16), gap: rs(12) },
  reflectionNumBadge: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center' },
  reflectionNum: { fontSize: rs(13), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  reflectionQuestion: { flex: 1, fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', lineHeight: rs(21) },
  reflectionInputWrap: { borderBottomWidth: 1.5, borderBottomColor: 'rgba(0,173,193,0.25)', paddingBottom: hs(6) },
  reflectionInputPremium: { fontSize: rs(14), color: '#1A1A1A', minHeight: hs(72), textAlignVertical: 'top', lineHeight: rs(22), paddingTop: 0 },
  reflectionNextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), marginTop: hs(16), backgroundColor: '#00ADC1', borderRadius: rs(10), paddingVertical: hs(10) },
  reflectionNextBtnDisabled: { backgroundColor: '#E8E8E8' },
  reflectionNextBtnText: { fontSize: rs(13), fontWeight: '700', color: '#FFFFFF' },
  pastReflectionWrap: { marginTop: hs(14), backgroundColor: 'rgba(0,173,193,0.07)', borderRadius: rs(10), padding: rs(12) },
  pastReflectionLabel: { fontSize: rs(11), fontWeight: '700', color: '#00ADC1', marginBottom: hs(4), letterSpacing: 0.6, textTransform: 'uppercase' },
  pastReflectionText: { fontSize: rs(13), color: '#3A3A3A', fontStyle: 'italic', lineHeight: rs(20) },

  // ── Quiz Input ──
  inputLabel: { fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', marginBottom: hs(8) },
  reflectionInputSmall: { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: rs(8), height: hs(60), padding: rs(12), fontSize: rs(14), color: '#1A1A1A', textAlignVertical: 'top', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },

  // ── Quiz MCQ Cards ──
  quizMcqCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), shadowColor: '#00ADC1', shadowOpacity: 0.10, shadowRadius: rs(14), shadowOffset: { width: 0, height: 5 }, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
  quizMcqHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: hs(16) },
  quizMcqBadge: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  quizMcqBadgeText: { fontSize: rs(13), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  quizMcqQuestion: { flex: 1, fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', lineHeight: rs(21) },

  // ── Quiz Options (shared with mastery) ──
  quizQuestion: { fontSize: rs(16), fontWeight: '700', color: '#1A1A1A', marginBottom: hs(20) },
  quizOptions: { gap: hs(12) },
  quizOptionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: rs(8), padding: rs(16), shadowColor: '#00ADC1', shadowOpacity: 0.05, shadowRadius: rs(8), shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  quizRadio: { width: rs(20), height: rs(20), borderRadius: rs(10), borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  quizRadioInner: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  quizOptionText: { fontSize: rs(14), color: '#1A1A1A' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: rs(4), padding: rs(8) },
  statusIconWrap: { width: rs(20), height: rs(20), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', marginRight: rs(8) },
  statusText: { fontSize: rs(13), fontWeight: '600' },

  tryAgainBtn: { alignSelf: 'center', marginTop: hs(16) },
  tryAgainText: { color: '#00ADC1', fontSize: rs(14), fontWeight: '700', textDecorationLine: 'underline' },

  // ── Previous button ──
  prevBtn: { position: 'absolute', bottom: hs(90), left: rs(24), flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingVertical: hs(6) },
  prevBtnText: { fontSize: rs(13), fontWeight: '700', color: '#00ADC1' },

  // ── Slide to Continue ──
  slideBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: hs(56), marginHorizontal: rs(16), marginBottom: hs(24), borderRadius: rs(8), overflow: 'hidden', backgroundColor: '#00ADC1', elevation: 4, shadowColor: '#00ADC1', shadowOpacity: 0.25, shadowRadius: rs(12), shadowOffset: { width: 0, height: 6 } },
  slideGrad: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  slideThumb: { width: rs(64), height: '100%', backgroundColor: '#89DFE9', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#68C3D2' },
  slideHand: { width: rs(28), height: rs(28), tintColor: '#FFFFFF' },
  slideText: { fontSize: rs(15), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  // ── Journey screen ──
  journeyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  journeyCard: { width: '100%', borderRadius: rs(16), paddingTop: hs(30), alignItems: 'center', overflow: 'hidden', elevation: 8, shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: rs(20), shadowOffset: { width: 0, height: 8 }, backgroundColor: '#FFFFFF' },
  journeyTitle: { fontSize: rs(28), fontWeight: '900', color: '#4CD6E8', marginBottom: hs(6), letterSpacing: 0.2 },
  journeySub: { fontSize: rs(13), color: '#666', marginBottom: hs(36), textAlign: 'center' },
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: hs(40) },
  journeyStepCard: { width: rs(105), height: rs(105), backgroundColor: '#FFFFFF', borderRadius: rs(8), shadowColor: '#00ADC1', shadowOpacity: 0.1, shadowRadius: rs(10), shadowOffset: { width: 0, height: 4 }, elevation: 3, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 173, 193, 0.05)' },
  journeyImg: { width: rs(44), height: rs(44), marginBottom: hs(8) },
  journeyStepLabel: { fontSize: rs(12), fontWeight: '600', color: '#1A1A1A' },
  journeyLineWrap: { width: rs(60), height: 2, flexDirection: 'row' },
  journeyLineLeft: { flex: 1, backgroundColor: '#FFD54F' },
  journeyLineRight: { flex: 1, backgroundColor: '#00ADC1' },
  journeyProgressRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: hs(16), marginTop: hs(-20) },
  journeyDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  journeyDotFilled: { backgroundColor: '#00ADC1' },
  journeyDotEmpty: { backgroundColor: '#D0EEF2' },
  journeyProgressLabel: { fontSize: rs(12), fontWeight: '700', color: '#00ADC1', marginLeft: rs(4) },
  journeyNote: { fontSize: rs(13), color: '#7A7A7A', textAlign: 'center', paddingHorizontal: rs(30), marginBottom: hs(24), lineHeight: rs(20) },
  doneBtn: { width: '100%', overflow: 'hidden' },
  doneBtnGrad: { paddingVertical: hs(18), alignItems: 'center', backgroundColor: '#00ADC1' },
  doneBtnText: { fontSize: rs(18), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
});

export default NameDetailScreen;
