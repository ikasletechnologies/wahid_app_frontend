import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Image, TouchableOpacity, StatusBar, PanResponder, ScrollView, TouchableWithoutFeedback, LayoutAnimation, ImageBackground, KeyboardAvoidingView, Platform, Keyboard, Share } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle as SvgCircle, Line, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import NameDetailHeader from '../components/NameDetailHeader';
import TimeBasedBackground from '../components/TimeBasedBackground';
import ReadingSettingsModal from '../components/ReadingSettingsModal';
import http from '../config/http';
import { FONTS } from '../theme';
import LottieView from 'lottie-react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 393;
const BASE_H = 900;
const wScale = SW / BASE_W;
const hScale = SH / BASE_H;
const rs = (n) => Math.round(n * wScale);
const hs = (n) => Math.round(n * hScale);

const countWords = (content) => {
  if (!content) return 0;
  if (Array.isArray(content)) {
    return content.reduce((sum, item) => {
      if (typeof item === 'string') {
        return sum + countWords(item);
      }
      if (item && typeof item === 'object') {
        return sum + countWords(item.view || item.simpleMeaning || item.tr || item.arabic || '');
      }
      return sum;
    }, 0);
  }
  return content.trim().split(/\s+/).filter(w => w.length > 0).length;
};

const getMeaningSentences = (nameObj) => {
  let displayMeaning = nameObj.description || nameObj.meaning || '';
  if (typeof displayMeaning === 'string' && displayMeaning.includes('—')) {
    displayMeaning = displayMeaning.split('—')[1].trim();
  }
  let parts = displayMeaning.split(/([.?!])(?:[\s]+|$)/);
  let sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    let text = parts[i];
    let punct = parts[i + 1] || '';
    let combined = (text + punct).trim();
    if (combined && combined.replace(/[.?!\s]/g, '').length > 0) sentences.push(combined);
  }
  return sentences.length > 0 ? sentences : [displayMeaning.trim()];
};

const getReferenceSentences = (refDataArray) => {
  const array = Array.isArray(refDataArray) ? refDataArray : [refDataArray];
  let sentences = [];
  array.forEach((ref) => {
    if (typeof ref === 'string') {
      let parts = ref.split(/([.?!])(?:[\s]+|$)/);
      for (let i = 0; i < parts.length; i += 2) {
        let text = parts[i];
        let punct = parts[i + 1] || '';
        let combined = (text + punct).trim();
        if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
          sentences.push({ type: 'string', text: combined, refData: ref });
        }
      }
    } else {
      const processText = (text, fieldType) => {
        if (!text) return;
        let parts = text.split(/([.?!])(?:[\s]+|$)/);
        for (let i = 0; i < parts.length; i += 2) {
          let textPart = parts[i];
          let punct = parts[i + 1] || '';
          let combined = (textPart + punct).trim();
          if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
            sentences.push({ type: fieldType, text: combined, refData: ref });
          }
        }
      };
      processText(ref.simpleMeaning, 'simpleMeaning');
      processText(ref.whyThisVerse || ref.significance, 'significance');
    }
  });
  return sentences;
};

const flattenToSentences = (arrayOrString) => {
  if (!arrayOrString) return [];
  const array = Array.isArray(arrayOrString) ? arrayOrString : [arrayOrString];
  let sentences = [];
  array.forEach(item => {
    if (!item) return;
    const itemStr = typeof item === 'object' ? (item.view || '') : String(item);
    let parts = itemStr.split(/([.?!])(?:[\s]+|$)/);
    for (let i = 0; i < parts.length; i += 2) {
      let text = parts[i];
      let punct = parts[i + 1] || '';
      let combined = (text + punct).trim();
      if (combined && combined.replace(/[.?!\s]/g, '').length > 0) {
        sentences.push(combined);
      }
    }
  });
  return sentences;
};

const FadeContent = ({ contentKey, children }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevKey = useRef(contentKey);

  useEffect(() => {
    if (contentKey !== prevKey.current) {
      prevKey.current = contentKey;
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setDisplayChildren(children);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    } else {
      setDisplayChildren(children);
    }
  }, [contentKey, children]);

  return <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>{displayChildren}</Animated.View>;
};

const NameDetailScreen = ({ route, navigation }) => {
  const { name, initialStepIndex = 0, draftProgress } = route.params;
  const { markAsLearned, masteredIds, revisitCounts, userReflections, incrementReadingTime, markAsDraft, removeDraft, reviewLaterIds, toggleReviewLater } = useNames();
  const { favouriteIds, toggleFavourite } = usePlaylist();
  const isFocused = useIsFocused();
  const { isDark, themeMode } = useAppTheme();
  const [readingSettingsVisible, setReadingSettingsVisible] = useState(false);
  const isMastered = masteredIds ? masteredIds.includes(name.id) : false;
  const isFavorite = favouriteIds ? favouriteIds.has(name.number || name.id) : false;
  const isReviewLater = reviewLaterIds ? reviewLaterIds.includes(name.number || name.id) : false;
  const revisits = revisitCounts[name.id] || 0;
  const isSaturated = isMastered || revisits >= 3;

  // Night-mode / Paper themed colors
  const t = useMemo(() => {
    if (themeMode === 'paper') {
      return {
        cardBg: '#FFFDF9',
        cardBorder: '#E6DCB8',
        text: '#2C221E',
        subText: '#5A4A42',
        dimText: '#8A7A72',
        inputBg: '#FAF6ED',
        inputBorder: 'rgba(5,150,105,0.30)',
        safeBg: '#FAF6ED',
        progressTrack: '#F4ECD8',
        pillText: '#2C221E',
        optionBg: '#FFFDF9',
        notebookLeft: '#F4ECD8',
        notebookBorder: '#D6CCB0',
        ringHole: '#FFFDF9',
        pastBg: 'rgba(5,150,105,0.12)',
        journeyCardBg: '#FFFDF9',
        journeyGrad: ['#FAF6ED', '#FFFDF9'],
        statusBg: '#FFFDF9',
      };
    }
    return isDark ? {
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
      safeBg: '#F8FAFC',
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
    };
  }, [isDark, themeMode]);

  // Determine if this is a Qur'anic name or Sunnah name
  // The first 81 are Qur'anic, the last 18 are Sunnah. We can also check if quranic array exists and has items.
  const isSunnah = name.sunnah && name.sunnah.length > 0 && (!name.quranic || name.quranic.length === 0);
  const categoryPillText = isSunnah ? 'Sunnah' : "Qur'anic";

  // Build the dynamic steps array
  const steps = useMemo(() => {
    const s = [];    // 1. Meaning Step
    s.push({ type: 'meaning' });

    // 2. Gifts Step (Moved right after Meaning as requested)
    if (name.gifts && name.gifts.length > 0) {
      s.push({ type: 'gifts' });
    }

    // 3. Qur'an References
    if (name.quran && name.quran.length > 0) {
      const formattedRefs = name.quran.map((ref) => {
        if (typeof ref === 'string') return ref;
        return {
          arabic: ref?.ar,
          simpleMeaning: ref?.tr,
          reference: ref?.ref,
          significance: ref?.whyThisVerse || ref?.significance
        };
      });
      s.push({ type: 'quran', data: formattedRefs });
    } else if (name.quranic && name.quranic.length > 0) {
      s.push({ type: 'quran', data: name.quranic });
    }

    // 4. Hadith / Sunnah References
    if (name.hadith && name.hadith.length > 0) {
      const formattedRefs = name.hadith.map((ref) => {
        if (typeof ref === 'string') return ref;
        return {
          arabic: ref?.ar,
          simpleMeaning: ref?.tr,
          reference: ref?.ref,
          significance: ref?.whyThisVerse || ref?.significance
        };
      });
      s.push({ type: 'hadith', data: formattedRefs });
    } else if (name.sunnah && name.sunnah.length > 0) {
      s.push({ type: 'hadith', data: name.sunnah });
    }
    if (name.practicalWays && name.practicalWays.length > 0) {
      s.push({ type: 'practical' });
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
  const [meaningSubStep, setMeaningSubStep] = useState(draftProgress?.meaningSubStep ?? -1);
  const [refSubStep, setRefSubStep] = useState(draftProgress?.refSubStep ?? -1);
  const [showArabicVerse, setShowArabicVerse] = useState(false);
  const [giftSubStep, setGiftSubStep] = useState(draftProgress?.giftSubStep ?? -1);
  const [practicalSubStep, setPracticalSubStep] = useState(draftProgress?.practicalSubStep ?? -1);
  const [scholarSubStep, setScholarSubStep] = useState(draftProgress?.scholarSubStep ?? -1);

  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const [reflectionSubStep, setReflectionSubStep] = useState(draftProgress?.reflectionSubStep ?? 0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef(null);
  const readingCardScrollRef = useRef(null);
  const lastReadTimerRef = useRef(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const triggerFlip = useCallback((callback) => {
    Animated.timing(flipAnim, {
      toValue: 90,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      flipAnim.setValue(-90);
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [flipAnim]);

  const [activeCardTime, setActiveCardTime] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    const loadTime = async () => {
      try {
        const nameKey = name.number || name.id;
        if (!nameKey) return;
        const stored = await AsyncStorage.getItem(`reading_time_name_${nameKey}`);
        if (stored) setActiveCardTime(parseInt(stored, 10));
      } catch (e) { }
    };
    loadTime();
  }, [name]);

  useEffect(() => {
    if (!isFocused || phase !== 'content' || isPaused) return;
    const interval = setInterval(() => {
      setActiveCardTime(prev => {
        const next = prev + 1;
        const nameKey = name.number || name.id;
        if (nameKey) {
          AsyncStorage.setItem(`reading_time_name_${nameKey}`, String(next)).catch(() => { });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFocused, name, phase, isPaused]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds} sec`;
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  // Persist reading position and mark as draft
  useEffect(() => {
    const nameNumber = name.number || name.id;
    if (phase === 'journey') {
      return;
    }

    AsyncStorage.setItem('last_reading_progress', JSON.stringify({
      nameNumber,
      stepIndex: currentStepIndex,
      timestamp: Date.now(),
    })).catch(() => { });

    AsyncStorage.setItem(`draft_progress_${nameNumber}`, JSON.stringify({
      stepIndex: currentStepIndex,
      meaningSubStep,
      giftSubStep,
      refSubStep,
      practicalSubStep,
      scholarSubStep,
      reflectionSubStep
    })).catch(() => { });

    // Debounce backend sync: only POST after the user settles on a step for 3s
    if (lastReadTimerRef.current) clearTimeout(lastReadTimerRef.current);
    lastReadTimerRef.current = setTimeout(() => {
      http.post('/api/me/last-read', { nameNumber, stepIndex: currentStepIndex }).catch(() => { });
    }, 3000);

    const hasStarted = currentStepIndex > 0 || meaningSubStep > -1 || giftSubStep > -1 || refSubStep > -1 || practicalSubStep > -1 || scholarSubStep > -1;
    if (hasStarted && phase === 'content' && !isMastered) {
      markAsDraft(nameNumber);
    }

    return () => {
      if (lastReadTimerRef.current) clearTimeout(lastReadTimerRef.current);
    };
  }, [currentStepIndex, meaningSubStep, giftSubStep, refSubStep, practicalSubStep, scholarSubStep, reflectionSubStep, name, phase, markAsDraft]);

  const isBackDisabled = useMemo(() => {
    if (showCelebration) return true;
    if (currentStepIndex === 0 && meaningSubStep === -1) return true;
    return false;
  }, [currentStepIndex, meaningSubStep, showCelebration]);

  // Active reading timer
  useEffect(() => {
    if (!isFocused || isPaused) return;
    const interval = setInterval(() => {
      incrementReadingTime(5);
    }, 5000);
    return () => clearInterval(interval);
  }, [isFocused, incrementReadingTime, isPaused]);

  const safeStepIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  const currentStep = steps[safeStepIndex];

  // Circle progress ring animation state and effect
  const [ringProgress, setRingProgress] = useState(0);
  const ringProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalSections = steps.length || 1;
    const targetProgress = (safeStepIndex + 1) / totalSections;
    
    const listenerId = ringProgressAnim.addListener(({ value }) => {
      setRingProgress(value);
    });

    Animated.timing(ringProgressAnim, {
      toValue: targetProgress,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    return () => {
      ringProgressAnim.removeListener(listenerId);
    };
  }, [safeStepIndex, steps.length]);

  // Solar system continuous orbital rotation
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 12000, // 12 seconds per full orbit
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const calculatedProgress = useMemo(() => {
    if (!steps || steps.length === 0) return 0;
    let totalSubsteps = 0;
    let completedSubsteps = 0;

    steps.forEach((step, idx) => {
      let stepTotal = 1;
      let stepCompleted = 0;

      if (step.type === 'meaning') {
        const sentences = getMeaningSentences(name);
        stepTotal = sentences.length;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = meaningSubStep === -1 ? 0 : meaningSubStep + 1;
        }
      } else if (step.type === 'quran' || step.type === 'hadith') {
        const refsCount = Array.isArray(step.data) ? step.data.length : 1;
        stepTotal = refsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = refSubStep === -1 ? 0 : refSubStep + 1;
        }
      } else if (step.type === 'gifts') {
        const giftsCount = name.gifts ? name.gifts.length : 1;
        stepTotal = giftsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = giftSubStep === -1 ? 0 : giftSubStep + 1;
        }
      } else if (step.type === 'practical') {
        const waysCount = name.practicalWays ? name.practicalWays.length : 1;
        stepTotal = waysCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = practicalSubStep === -1 ? 0 : practicalSubStep + 1;
        }
      } else if (step.type === 'scholarly') {
        const viewsCount = name.scholarlyViews ? name.scholarlyViews.length : 1;
        stepTotal = viewsCount;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = scholarSubStep === -1 ? 0 : scholarSubStep + 1;
        }
      } else if (step.type === 'reflection') {
        stepTotal = 3;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = reflectionSubStep;
        }
      } else if (step.type === 'mastery') {
        stepTotal = 1;
        if (idx < safeStepIndex) {
          stepCompleted = stepTotal;
        } else if (idx === safeStepIndex) {
          stepCompleted = masteryDone ? 1 : 0;
        }
      }

      totalSubsteps += stepTotal;
      completedSubsteps += stepCompleted;
    });

    if (totalSubsteps === 0) return 0;
    return Math.min(1, Math.max(0, completedSubsteps / totalSubsteps));
  }, [steps, safeStepIndex, meaningSubStep, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, reflectionSubStep, masteryDone, name]);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: calculatedProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [calculatedProgress]);

  useEffect(() => {
    if (currentStepIndex !== safeStepIndex) {
      setCurrentStepIndex(safeStepIndex);
    }
  }, [currentStepIndex, safeStepIndex]);

  const isSlideDisabled = useMemo(() => {
    if (showCelebration) return true;
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
  }, [showCelebration, currentStep, masteryDone, masteryAnswer, name.mcq, reflection1, reflection2, reflection3]);

  // Animations
  const exitAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const slidePanX = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const slideBtnScale = useRef(new Animated.Value(1)).current;
  const handLoopRef = useRef(null);

  const journeyOpacity = useRef(new Animated.Value(0)).current;
  const journeyTranslate = useRef(new Animated.Value(50)).current;

  const handleClose = useCallback(() => {
    Animated.timing(exitAnim, {
      toValue: Dimensions.get('window').height,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.poly(4)),
    }).start(() => {
      navigation.goBack();
    });
  }, [exitAnim, navigation]);

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
          scrollViewRef.current?.scrollToEnd?.({ animated: true });
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

    // Update state instantly so the outer card remains fixed
    // The FadeContent component inside will handle the text cross-fading
    setCurrentStepIndex(index);
    setMeaningSubStep(-1);
    setRefSubStep(-1);
    setShowArabicVerse(false);
    setGiftSubStep(-1);
    setPracticalSubStep(-1);
    setScholarSubStep(-1);
    setReflection1('');
    setReflection2('');
    setReflection3('');
    setReflectionSubStep(0);
  }, [steps.length]);

  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      triggerFlip(() => {
        goToStep(currentStepIndex + 1);
      });
    }
  }, [currentStepIndex, steps.length, goToStep, triggerFlip]);

  const goPrev = useCallback(() => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    if (currentStep.type !== 'mastery' && currentStep.type !== 'reflection') {
      setIsFocusMode(true);
    }

    if (currentStep.type === 'meaning' && meaningSubStep > -1) {
      if (meaningSubStep === 0) {
        triggerFlip(() => setMeaningSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMeaningSubStep(prev => prev - 1);
      }
      return;
    } else if ((currentStep.type === 'quran' || currentStep.type === 'hadith') && refSubStep > -1) {
      if (refSubStep === 0) {
        triggerFlip(() => {
          setRefSubStep(-1);
          setShowArabicVerse(false);
        });
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRefSubStep(prev => prev - 1);
        setShowArabicVerse(false);
      }
      return;
    } else if (currentStep.type === 'gifts' && giftSubStep > -1) {
      if (giftSubStep === 0) {
        triggerFlip(() => setGiftSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setGiftSubStep(prev => prev - 1);
      }
      return;
    } else if (currentStep.type === 'practical' && practicalSubStep > -1) {
      if (practicalSubStep === 0) {
        triggerFlip(() => setPracticalSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setPracticalSubStep(prev => prev - 1);
      }
      return;
    } else if (currentStep.type === 'scholarly' && scholarSubStep > -1) {
      if (scholarSubStep === 0) {
        triggerFlip(() => setScholarSubStep(-1));
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setScholarSubStep(prev => prev - 1);
      }
      return;
    }

    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      triggerFlip(() => {
        goToStep(currentStepIndex - 1);
        // Restore the LAST sub-step of the previous section so Previous feels natural
        if (prevStep?.type === 'meaning') {
          const sentences = getMeaningSentences(name);
          setMeaningSubStep(Math.max(0, sentences.length - 1));
        } else if (prevStep?.type === 'quran' || prevStep?.type === 'hadith') {
          const refsCount = Array.isArray(prevStep.data) ? prevStep.data.length : 1;
          setRefSubStep(Math.max(0, refsCount - 1));
        } else if (prevStep?.type === 'gifts') {
          const sents = flattenToSentences(name.gifts);
          setGiftSubStep(Math.max(0, sents.length - 1));
        } else if (prevStep?.type === 'practical') {
          const sents = flattenToSentences(name.practicalWays);
          setPracticalSubStep(Math.max(0, sents.length - 1));
        } else if (prevStep?.type === 'scholarly') {
          const sents = flattenToSentences(name.scholarlyViews);
          setScholarSubStep(Math.max(0, sents.length - 1));
        }
      });
    }
  }, [currentStepIndex, goToStep, steps, meaningSubStep, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, name, triggerFlip]);

  const goJourney = useCallback((reflectionData = null) => {
    const nameNumber = name.number || name.id;
    markAsLearned(name.id, reflectionData);
    removeDraft(nameNumber);
    AsyncStorage.removeItem('last_reading_progress').catch(() => { });
    AsyncStorage.removeItem(`draft_progress_${nameNumber}`).catch(() => { });
    setPhase('journey');
    Animated.parallel([
      Animated.timing(journeyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(journeyTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [markAsLearned, name.id, name.number, journeyOpacity, journeyTranslate, removeDraft]);

  const triggerSectionCelebration = useCallback((callback) => {
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      callback();
    }, 1800);
  }, []);

  const handleNext = useCallback(() => {
    setIsPaused(false);
    let ans = 0;
    if (name.mcq && name.mcq.length > 0) ans = name.mcq[0].ans;

    if (currentStep.type !== 'mastery' && currentStep.type !== 'reflection') {
      setIsFocusMode(true);
    }

    // Celebration only fires when the NEXT step is reflection or mastery
    const isLastContentStep = () => {
      const nextIdx = currentStepIndex + 1;
      if (nextIdx >= steps.length) return false;
      const t = steps[nextIdx]?.type;
      return t === 'reflection' || t === 'mastery';
    };
    const advance = () => isLastContentStep() ? triggerSectionCelebration(goNext) : goNext();

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
    } else if (currentStep.type === 'meaning') {
      const sentences = getMeaningSentences(name);
      let nextStep = meaningSubStep + 1;
      while (nextStep < sentences.length && !sentences[nextStep]?.replace(/[.?!\s]/g, '').length) {
        nextStep++;
      }
      if (nextStep < sentences.length) {
        if (meaningSubStep === -1) {
          triggerFlip(() => setMeaningSubStep(nextStep));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMeaningSubStep(nextStep);
        }
      } else {
        advance();
      }
    } else if (currentStep.type === 'quran' || currentStep.type === 'hadith') {
      const sents = getReferenceSentences(currentStep.data);
      if (refSubStep < sents.length - 1) {
        if (refSubStep === -1) {
          triggerFlip(() => {
            setRefSubStep(prev => prev + 1);
            setShowArabicVerse(false);
          });
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setRefSubStep(prev => prev + 1);
          setShowArabicVerse(false);
        }
      } else {
        advance();
      }
    } else if (currentStep.type === 'gifts') {
      const sents = flattenToSentences(name.gifts);
      if (giftSubStep < sents.length - 1) {
        if (giftSubStep === -1) {
          triggerFlip(() => setGiftSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setGiftSubStep(prev => prev + 1);
        }
      } else {
        advance();
      }
    } else if (currentStep.type === 'practical') {
      const sents = flattenToSentences(name.practicalWays);
      if (practicalSubStep < sents.length - 1) {
        if (practicalSubStep === -1) {
          triggerFlip(() => setPracticalSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPracticalSubStep(prev => prev + 1);
        }
      } else {
        advance();
      }
    } else if (currentStep.type === 'scholarly') {
      const sents = flattenToSentences(name.scholarlyViews);
      if (scholarSubStep < sents.length - 1) {
        if (scholarSubStep === -1) {
          triggerFlip(() => setScholarSubStep(prev => prev + 1));
        } else {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setScholarSubStep(prev => prev + 1);
        }
      } else {
        advance();
      }
    } else {
      goNext();
    }
  }, [goJourney, currentStep.type, masteryDone, masteryAnswer, name.mcq, triggerSectionCelebration, goNext, currentStepIndex, steps, refSubStep, giftSubStep, practicalSubStep, scholarSubStep, name.gifts, name.practicalWays, name.scholarlyViews, reflection1, reflection2, reflection3, meaningSubStep, name, currentStep.data, triggerFlip]);



  // ── Render Helpers ──

  const DecorativeFlower = ({ color }) => (
    <Svg width={rs(24)} height={rs(24)} viewBox="0 0 24 24">
      {/* 8-petal geometric flower */}
      <Path d="M12 2 C13 7 17 11 22 12 C17 13 13 17 12 22 C11 17 7 13 2 12 C7 11 11 7 12 2" fill={color} />
      <Path d="M4.9 4.9 C8.4 7 11.2 11.2 12 12 C11.2 12.8 7 15.6 4.9 19.1 C7 15.6 11.2 12.8 12 12 C12.8 11.2 15.6 7 19.1 4.9 C15.6 7 12.8 11.2 12 12" fill={color} />
      <SvgCircle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
    </Svg>
  );

  const renderReadingCard = ({ title, text, badgeIcon, scholarName, scholarWork, customContent, scrollEnabled = false }) => (
    <View style={styles.tabContentContainer}>
      <View style={[styles.modernCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F0F4F8' }]}>

        {/* Top Badges Row */}
        <View style={styles.cardBadgesRow}>
          <View style={[styles.badgeCircle, { backgroundColor: isDark ? '#0F172A' : '#F0F9FA', flexShrink: 0 }]}>
            <Ionicons name={badgeIcon} size={rs(20)} color="#16858A" />
          </View>
          <Text style={[styles.cardHeaderTitleText, { color: isDark ? '#E8EDF2' : '#14363F', marginLeft: rs(14) }]}>
            {title}
          </Text>
          <View style={[styles.badgePill, { backgroundColor: isDark ? '#0F172A' : '#F0F9FA', marginLeft: 'auto', flexShrink: 0 }]}>
            <Ionicons name="time-outline" size={rs(15)} color="#16858A" style={{ marginRight: rs(4) }} />
            <Text style={[styles.badgePillText, { color: isDark ? '#C5F2F7' : '#14363F', fontWeight: '700' }]}>{formatTime(activeCardTime)}</Text>
          </View>
        </View>

        {/* Custom Divider */}
        <View style={styles.customDividerWrap}>
          <View style={[styles.dividerDot, { backgroundColor: isDark ? '#4CD5E8' : '#A4D0CB' }]} />
          <View style={[styles.dividerDot, { backgroundColor: '#16858A', marginLeft: rs(4) }]} />
          <View style={[styles.customDividerLine, { backgroundColor: isDark ? '#334155' : '#D1E8E6', marginLeft: rs(6), marginRight: rs(12) }]} />
          
          <DecorativeFlower color="#16858A" />
          
          <View style={[styles.customDividerLine, { backgroundColor: isDark ? '#334155' : '#D1E8E6', marginLeft: rs(12), marginRight: rs(6) }]} />
          <View style={[styles.dividerDot, { backgroundColor: '#16858A', marginRight: rs(4) }]} />
          <View style={[styles.dividerDot, { backgroundColor: isDark ? '#4CD5E8' : '#A4D0CB' }]} />
        </View>

        {/* Main Text with Proper Fade Animation */}
        <View
          style={styles.textScrollView}
        >
          <FadeContent contentKey={text || (customContent ? 'custom' : '')}>
            {customContent ? customContent : (
              <>
                <Text style={[styles.readingText, { color: isDark ? '#E8EDF2' : '#14363F' }]}>{text}</Text>
                {!!scholarName && <Text style={[styles.scholarName, { color: t.text, marginTop: hs(16) }]}>{scholarName}</Text>}
                {!!scholarWork && <Text style={[styles.scholarWork, { color: '#00ADC1' }]}>{scholarWork}</Text>}
              </>
            )}
          </FadeContent>
        </View>

        {/* Bottom Graphic Overlay */}
        <View style={styles.bottomGraphicWrap}>
           <Svg width="100%" height={hs(80)} viewBox="0 0 300 80" preserveAspectRatio="none">
             <Path d="M0 50 Q 75 80 150 50 T 300 50 L 300 80 L 0 80 Z" fill={isDark ? 'rgba(0,173,193,0.05)' : '#F2FAF9'} />
           </Svg>
           {/* Scattered Dots */}
           <View style={[styles.scatterDot, { backgroundColor: '#FF9A92', left: '12%', top: '30%' }]} />
           <View style={[styles.scatterDot, { backgroundColor: '#6DC5C9', left: '38%', top: '70%' }]} />
           <View style={[styles.scatterDot, { backgroundColor: '#F9CF6E', left: '62%', top: '55%' }]} />
           <View style={[styles.scatterDot, { backgroundColor: '#FF9A92', left: '88%', top: '35%' }]} />
           <View style={[styles.scatterDot, { backgroundColor: '#92D7B4', left: '85%', top: '80%' }]} />
        </View>

      </View>
    </View>
  );

  const renderIntroCard = ({ title, iconName, subtitle, insightsCount = 0 }) => {
    const sectionNum = safeStepIndex + 1;
    const totalSections = steps.length;

    return (
      <View style={styles.tabContentContainer}>
        <View style={[styles.introCard2, {
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F4F8',
          backgroundColor: isDark ? '#162331' : '#FFFFFF',
        }]}>
          <View style={{ width: '100%', paddingBottom: hs(20), justifyContent: 'center' }}>
            {/* Section badge row with flanking ornaments */}
            <View style={styles.sectionBadgeRow}>
              <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
              <Text style={[styles.badgeStar, { color: isDark ? 'rgba(0,173,193,0.4)' : '#16858A' }]}>✦</Text>
              <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
              
              <View style={[styles.sectionBadge, {
                backgroundColor: isDark ? 'rgba(0, 173, 193, 0.08)' : '#F0FAFB',
                borderColor: isDark ? 'rgba(0, 173, 193, 0.25)' : '#16858A',
                borderWidth: 1,
              }]}>
                <Text style={[styles.sectionBadgeText, { color: isDark ? '#4CD5E8' : '#16858A', fontWeight: '800' }]}>SECTION {sectionNum} OF {totalSections}</Text>
              </View>
              
              <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
              <Text style={[styles.badgeStar, { color: isDark ? 'rgba(0,173,193,0.4)' : '#16858A' }]}>✦</Text>
              <View style={[styles.badgeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#A4D0CB' }]} />
            </View>

            {/* Icon area with SVG Progress Ring */}
            <View style={styles.introIconArea}>
              <View style={styles.svgRingWrapper}>
                <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
                  <Svg width={rs(134)} height={rs(134)} viewBox="0 0 134 134">
                    {/* Background thin circle */}
                    <SvgCircle
                      cx="67"
                      cy="67"
                      r="65"
                      stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 173, 193, 0.12)'}
                      strokeWidth="1.2"
                      fill="transparent"
                    />
                    {/* Progress arc */}
                    <SvgCircle
                      cx="67"
                      cy="67"
                      r="65"
                      stroke="#00ADC1"
                      strokeWidth="1.5"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 65}`}
                      strokeDashoffset={`${2 * Math.PI * 65 * (1 - ringProgress)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 67 67)"
                    />
                    {/* Progress Dot */}
                    <SvgCircle
                      cx={`${67 + 65 * Math.cos(ringProgress * 2 * Math.PI - Math.PI / 2)}`}
                      cy={`${67 + 65 * Math.sin(ringProgress * 2 * Math.PI - Math.PI / 2)}`}
                      r="3.5"
                      fill="#00ADC1"
                    />
                  </Svg>
                </Animated.View>
                
                {/* Central Circle */}
                <View style={[styles.introIconCircle, { 
                  backgroundColor: isDark ? '#1E2D3D' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F8FA',
                  shadowColor: isDark ? '#000000' : '#00ADC1',
                }]}>
                  <Ionicons name={iconName} size={rs(32)} color="#00ADC1" />
                </View>
              </View>
            </View>

            {/* Title & Subtitle */}
            <FadeContent contentKey={title}>
              <Text style={[styles.introTitleText2, { color: isDark ? '#E8EDF2' : '#0A1128', marginBottom: hs(16) }]}>{title}</Text>
            </FadeContent>

            {/* Info pills */}
            <View style={styles.introInfoRow}>
              {insightsCount > 0 && (
                <View style={[styles.introInfoPill, { backgroundColor: isDark ? 'rgba(0,173,193,0.1)' : '#F0FAFB', borderColor: isDark ? '#00ADC1' : '#16858A' }]}>
                  <Ionicons name="document-text-outline" size={rs(14)} color={isDark ? '#4CD5E8' : '#16858A'} style={{ marginRight: rs(6) }} />
                  <Text style={[styles.introInfoText, { color: isDark ? '#C5F2F7' : '#14363F', fontWeight: '700' }]}>{insightsCount} Insights</Text>
                </View>
              )}
              <View style={[styles.introInfoPill, { backgroundColor: isDark ? 'rgba(0,173,193,0.1)' : '#F0FAFB', borderColor: isDark ? '#00ADC1' : '#16858A' }]}>
                <Ionicons name="time-outline" size={rs(14)} color={isDark ? '#4CD5E8' : '#16858A'} style={{ marginRight: rs(6) }} />
                <Text style={[styles.introInfoText, { color: isDark ? '#C5F2F7' : '#14363F', fontWeight: '700' }]}>{formatTime(activeCardTime)}</Text>
              </View>
            </View>

            {/* Start reading indicator */}
            <TouchableOpacity 
              style={{ marginTop: hs(24), alignItems: 'center' }} 
              activeOpacity={0.8}
              onPress={handleNext}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00ADC1', paddingHorizontal: rs(20), paddingVertical: hs(10), borderRadius: rs(20) }}>
                <Text style={{ color: '#FFFFFF', fontSize: rs(14), fontWeight: '700', marginRight: rs(8) }}>Start Reading</Text>
                <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  const renderMeaning = () => {
    if (meaningSubStep === -1) {
      const sentences = getMeaningSentences(name);
      const meaningText = sentences.join(' ');
      const wordCount = countWords(meaningText);
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'Simple Meaning',
        iconName: 'book-outline',
        subtitle: `Understand the essence of ${name.transliteration || name.tr || name.name}\n\n"${name.meaning || name.en || ''}"`,
        insightsCount: sentences.length,
        readTimeSec,
      });
    }
    const sentences = getMeaningSentences(name);
    const currentSentence = sentences[meaningSubStep] || '';
    return renderReadingCard({ title: 'Simple Meaning', text: currentSentence, badgeIcon: 'book-outline' });
  };

  const renderReference = (refDataArray, type) => {
    const isQuran = type === 'quran';
    const title = isQuran ? "Pearls from the Qur'an" : "Pearls from the Hadith";

    const sents = getReferenceSentences(refDataArray);

    if (refSubStep === -1) {
      const refText = sents.map(s => s.text).join(' ');
      const wordCount = countWords(refText);
      const readTimeSec = Math.max(20, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title,
        iconName: 'library-outline',
        subtitle: isQuran
          ? `Explore Holy Qur'an verses referencing ${name.transliteration || name.name}`
          : `Explore Prophetic traditions referencing ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }

    const currentSent = sents[refSubStep];
    if (!currentSent) return null;
    
    const refData = currentSent.refData;

    if (currentSent.type === 'string') {
      return renderReadingCard({ title, text: currentSent.text, badgeIcon: 'library-outline' });
    }

    const customContent = (
      <View style={{ width: '100%' }}>
        {!!refData.reference && (
          <View style={styles.refBadgeRow}>
            <View style={[styles.refBadgePill, { backgroundColor: isDark ? '#0F2A30' : '#E8F9FB', borderColor: isDark ? '#1E4A55' : '#A0E4EC' }]}>
              <Ionicons name="book-outline" size={rs(13)} color="#00ADC1" style={{ marginRight: rs(6) }} />
              <Text style={[styles.refBadgeText, { color: isDark ? '#9EAAB8' : '#1A4A55' }]}>{refData.reference}</Text>
            </View>
          </View>
        )}

        <Text style={[styles.refSectionLabel, { color: isDark ? '#4CD5E8' : '#16858A' }]}>
          {currentSent.type === 'simpleMeaning' ? 'Simple explanation' : (isQuran ? 'Why this verse:' : 'Why this Hadith:')}
        </Text>

        <Text style={[styles.readingText, { color: t.text, marginBottom: hs(20) }]}>{currentSent.text}</Text>

        {!!refData.arabic && (
          <>
            <TouchableOpacity
              style={[styles.seeArabicBtn, { borderColor: isDark ? 'rgba(0,173,193,0.30)' : 'rgba(0,173,193,0.25)', backgroundColor: isDark ? '#0F2A30' : '#F0FCFD' }]}
              onPress={() => {
                setShowArabicVerse(prev => {
                  const nxt = !prev;
                  if (!nxt) {
                    setTimeout(() => readingCardScrollRef.current?.scrollTo({ y: 0, animated: true }), 150);
                  }
                  return nxt;
                });
              }}
              activeOpacity={0.75}
            >
              <Ionicons name={showArabicVerse ? 'eye-off-outline' : 'eye-outline'} size={rs(16)} color="#00ADC1" style={{ marginRight: rs(8) }} />
              <Text style={styles.seeArabicBtnText}>{showArabicVerse ? 'Hide Arabic Verse' : 'See Arabic Verse'}</Text>
            </TouchableOpacity>

            {showArabicVerse && (
              <View style={[styles.arabicVerseBox, { backgroundColor: isDark ? '#0D1F29' : '#F8FDFE', borderColor: isDark ? 'rgba(0,173,193,0.20)' : '#C8F0F5' }]}>
                <Text style={[styles.modernArabicText, { color: t.text }]}>{refData.arabic}</Text>
              </View>
            )}
          </>
        )}
      </View>
    );

    return renderReadingCard({ title, customContent, badgeIcon: 'library-outline', scrollEnabled: showArabicVerse });
  };

  const renderGifts = () => {
    const sents = flattenToSentences(name.gifts);
    if (giftSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'The Gift of This Name',
        iconName: 'gift-outline',
        subtitle: `Discover the spiritual gifts and blessings connected to ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const currentGift = sents[giftSubStep] || '';
    return renderReadingCard({ title: 'The Gift of This Name', text: currentGift, badgeIcon: 'gift-outline' });
  };

  const renderPractical = () => {
    const sents = flattenToSentences(name.practicalWays);
    if (practicalSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'How To Live With This Name',
        iconName: 'compass-outline',
        subtitle: `Actionable ways to embody and live by ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const way = sents[practicalSubStep] || '';
    return renderReadingCard({ title: 'How To Live With This Name', text: way, badgeIcon: 'compass-outline' });
  };

  const renderScholarly = () => {
    const sents = flattenToSentences(name.scholarlyViews);
    if (scholarSubStep === -1) {
      const wordCount = countWords(sents.join(' '));
      const readTimeSec = Math.max(15, Math.round((wordCount / 180) * 60));
      return renderIntroCard({
        title: 'Scholarly View',
        iconName: 'school-outline',
        subtitle: `Classical scholarly wisdom and commentary on ${name.transliteration || name.name}`,
        insightsCount: sents.length,
        readTimeSec,
      });
    }
    const viewText = sents[scholarSubStep] || '';
    if (!viewText) return null;
    return renderReadingCard({ title: 'Scholarly View', text: `"${viewText}"`, badgeIcon: 'school-outline' });
  };

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
                        scrollViewRef.current?.scrollToEnd?.({ animated: true });
                        // Re-focus after scroll settles
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd?.({ animated: true });
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this beautiful Name of Allah: ${name.transliteration} (${name.arabic}) - ${name.meaning}.\n\nLearn more on the Wahid App!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
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
    <Animated.View style={[styles.root, { transform: [{ translateY: exitAnim }] }]}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <SafeAreaView style={{ flex: 1, backgroundColor: t.safeBg }} edges={['top']}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <View style={{ flex: 1 }}>
                  {isFocusMode && (
                    <BlurView 
                      pointerEvents="none"
                      tint="dark"
                      intensity={40}
                      style={[StyleSheet.absoluteFillObject, { top: -200, bottom: -200, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 50 }]}
                    />
                  )}

                  <View style={{ zIndex: 10 }}>
                    <NameDetailHeader
                      name={name}
                      steps={steps}
                      currentStepIndex={safeStepIndex}
                      isFavorite={isFavorite}
                      onFavoritePress={() => toggleFavourite(name.number || name.id)}
                      onSharePress={() => Share.share({ message: `Learn about the name ${name.transliteration} - ${name.meaning}` })}
                      onSettingsPress={() => setReadingSettingsVisible(true)}
                    />
                  </View>

                  {/* ── Fixed Main Title ── */}
                  {(() => {
                    let stepTitle = null;
                    if (currentStep.type === 'gifts') stepTitle = '';
                    else if (currentStep.type === 'practical') stepTitle = '';
                    else if (currentStep.type === 'scholarly') stepTitle = 'Scholarly Views';
                    else if (currentStep.type === 'reflection') stepTitle = 'Reflection';
                    else if (currentStep.type === 'mastery') stepTitle = 'Mastery Test';

                    if (!stepTitle) return null;
                    return (
                      <Animated.View style={{ opacity: contentOpacity, paddingHorizontal: rs(20), marginBottom: hs(12), zIndex: 10 }}>
                        <Text style={[styles.mainTitle, { marginBottom: 0, color: t.text }]}>{stepTitle}</Text>
                      </Animated.View>
                    );
                  })()}

                  <View
                    ref={scrollViewRef}
                    style={[styles.scrollArea, { zIndex: 60 }, styles.scrollContent]}
                  >
                    {isFocusMode && (
                      <TouchableOpacity 
                        activeOpacity={1}
                        style={[StyleSheet.absoluteFill, { bottom: -500 }]} 
                        onPress={() => setIsFocusMode(false)} 
                      />
                    )}
                    <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }, { rotateY: flipAnim.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) }] }}>
                      {currentStep.type === 'meaning' && renderMeaning()}
                      {(currentStep.type === 'quran' || currentStep.type === 'hadith') && renderReference(currentStep.data, currentStep.type)}
                      {currentStep.type === 'gifts' && renderGifts()}
                      {currentStep.type === 'practical' && renderPractical()}
                      {currentStep.type === 'scholarly' && renderScholarly()}
                      {currentStep.type === 'reflection' && renderReflection()}
                      {currentStep.type === 'mastery' && renderMastery()}
                    </Animated.View>
                    {currentStep.type === 'reflection' && (
                      <View style={{ height: hs(40) }} />
                    )}
                  </View>

                  {/* ── Bottom Navigation ── */}
                  <View style={[styles.bottomNavWrapper, { zIndex: 10 }]}>
                  <View style={[styles.bottomNavInner, { 
                    backgroundColor: isDark ? '#141D2B' : '#FFFFFF',
                    shadowColor: isDark ? '#000000' : '#00ADC1',
                  }]}>
                    {/* Previous */}
                    <TouchableOpacity
                      style={[styles.squircleNavBtn, { opacity: isBackDisabled ? 0.4 : 1 }]}
                      disabled={isBackDisabled}
                      onPress={goPrev}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-back" size={rs(20)} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Pause */}
                    <View style={styles.pauseWrap}>
                      {!isDark && (
                        <View style={{ position: 'absolute', top: -hs(12), width: rs(80), height: rs(80), alignItems: 'center', justifyContent: 'center', zIndex: 1 }} pointerEvents="none">
                          <Svg width={rs(80)} height={rs(80)}>
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                              const rad = (deg * Math.PI) / 180;
                              const r1 = rs(20);
                              const r2 = rs(25);
                              const center = rs(40);
                              return (
                                <Line
                                  key={i}
                                  x1={center + r1 * Math.cos(rad)}
                                  y1={center + r1 * Math.sin(rad)}
                                  x2={center + r2 * Math.cos(rad)}
                                  y2={center + r2 * Math.sin(rad)}
                                  stroke="#FACC15"
                                  strokeWidth={rs(3.5)}
                                  strokeLinecap="round"
                                />
                              );
                            })}
                          </Svg>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => setIsPaused(p => !p)} activeOpacity={0.8} style={styles.pauseBtn}>
                        {isDark ? (
                          <View style={{ width: rs(58), height: rs(58), justifyContent: 'center', alignItems: 'center' }}>
                            <Svg width={rs(58)} height={rs(58)} style={StyleSheet.absoluteFillObject}>
                              <SvgCircle cx={rs(29)} cy={rs(29)} r={rs(28)} fill="#141E30" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                              {/* Stars */}
                              {/* Top Left Four-Pointed Star */}
                              <Path d={`M${rs(15)},${rs(12)} Q${rs(15)},${rs(15)} ${rs(18)},${rs(15)} Q${rs(15)},${rs(15)} ${rs(15)},${rs(18)} Q${rs(15)},${rs(15)} ${rs(12)},${rs(15)} Q${rs(15)},${rs(15)} ${rs(15)},${rs(12)} Z`} fill="#FFFFFF" opacity={0.9} />

                              {/* Top Dot */}
                              <SvgCircle cx={rs(29)} cy={rs(7)} r={rs(1)} fill="#FFFFFF" opacity={0.6} />

                              {/* Top Right Dot */}
                              <SvgCircle cx={rs(45)} cy={rs(14)} r={rs(1.2)} fill="#FFFFFF" opacity={0.8} />

                              {/* Right Dot */}
                              <SvgCircle cx={rs(52)} cy={rs(29)} r={rs(1)} fill="#FFFFFF" opacity={0.5} />

                              {/* Bottom Right Four-Pointed Star */}
                              <Path d={`M${rs(44)},${rs(42)} Q${rs(44)},${rs(44)} ${rs(46)},${rs(44)} Q${rs(44)},${rs(44)} ${rs(44)},${rs(46)} Q${rs(44)},${rs(44)} ${rs(42)},${rs(44)} Q${rs(44)},${rs(44)} ${rs(44)},${rs(42)} Z`} fill="#FFFFFF" opacity={0.7} />

                              {/* Bottom Dot */}
                              <SvgCircle cx={rs(29)} cy={rs(51)} r={rs(1.5)} fill="#FFFFFF" opacity={0.9} />

                              {/* Bottom Left Dot */}
                              <SvgCircle cx={rs(14)} cy={rs(43)} r={rs(1.2)} fill="#FFFFFF" opacity={0.6} />

                              {/* Left Dot */}
                              <SvgCircle cx={rs(7)} cy={rs(29)} r={rs(1)} fill="#FFFFFF" opacity={0.7} />
                            </Svg>
                            <View style={{ width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: rs(6), elevation: 4 }}>
                              {isPaused ? (
                                <Svg width={rs(12)} height={rs(14)} viewBox="0 0 14 16" style={{ marginLeft: rs(3) }}>
                                  <Path d="M0 0L14 8L0 16V0Z" fill="#1E293B" />
                                </Svg>
                              ) : (
                                <View style={{ flexDirection: 'row', gap: rs(4) }}>
                                  <View style={{ width: rs(3.5), height: rs(12), backgroundColor: '#1E293B', borderRadius: rs(2) }} />
                                  <View style={{ width: rs(3.5), height: rs(12), backgroundColor: '#1E293B', borderRadius: rs(2) }} />
                                </View>
                              )}
                            </View>
                          </View>
                        ) : (
                          <View style={{ width: rs(56), height: rs(56), justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ width: rs(38), height: rs(38), borderRadius: rs(19), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#00ADC1', shadowOpacity: 0.15, shadowRadius: rs(6), shadowOffset: { width: 0, height: 3 }, elevation: 3, borderWidth: 1, borderColor: '#F4F9FA' }}>
                              {isPaused ? (
                                <Svg width={rs(14)} height={rs(16)} viewBox="0 0 14 16" style={{ marginLeft: rs(3) }}>
                                  <Path d="M0 0L14 8L0 16V0Z" fill="#FACC15" />
                                </Svg>
                              ) : (
                                <View style={{ flexDirection: 'row', gap: rs(4) }}>
                                  <View style={{ width: rs(3.5), height: rs(12), backgroundColor: '#FACC15', borderRadius: rs(2) }} />
                                  <View style={{ width: rs(3.5), height: rs(12), backgroundColor: '#FACC15', borderRadius: rs(2) }} />
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={[styles.pauseText, { color: isDark ? '#94A3B8' : '#112F33' }]}>{isPaused ? 'Resume' : 'Pause'}</Text>
                    </View>

                    {/* Continue */}
                    <TouchableOpacity
                      style={[styles.squircleNavBtn, { opacity: isSlideDisabled ? 0.4 : 1 }]}
                      disabled={isSlideDisabled}
                      onPress={handleNext}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-forward" size={rs(20)} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Section Celebration Overlay */}
            {showCelebration && (
              <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
                <LottieView
                  source={require('../../assets/animation/celebration.json')}
                  autoPlay
                  loop={false}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            )}
          </>
        )}
      </TimeBasedBackground>

      <ReadingSettingsModal
        visible={readingSettingsVisible}
        onClose={() => setReadingSettingsVisible(false)}
      />
    </Animated.View>
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

  // ── Modern Cards (Glassmorphic / Minimal) ──
  modernCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: rs(16), borderWidth: 1, borderColor: '#F0F4F8', overflow: 'visible', minHeight: hs(360), paddingBottom: 0 },
  cardBadgesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(24), paddingTop: hs(16), zIndex: 2 },
  badgeCircle: { width: rs(44), height: rs(44), borderRadius: rs(22), justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), minHeight: rs(34), paddingVertical: hs(6), borderRadius: rs(17) },
  badgePillText: { fontSize: rs(12.5), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '700' },
  cardHeaderTitleText: { fontSize: rs(18), fontWeight: '700', flexShrink: 1, fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' },
  customDividerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24), marginVertical: hs(12), zIndex: 2 },
  customDividerLine: { flex: 1, height: 1.5 },
  dividerDot: { width: rs(4), height: rs(4), borderRadius: rs(2) },
  textContentWrap: { flex: 1, paddingHorizontal: rs(30), paddingTop: hs(10), paddingBottom: hs(30), alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  textScrollView: { width: '100%', zIndex: 2, paddingHorizontal: rs(24), paddingBottom: hs(85), justifyContent: 'center' },
  textScrollContent: { flexGrow: 1, paddingHorizontal: rs(40), paddingTop: hs(10), paddingBottom: hs(40), alignItems: 'center', justifyContent: 'center' },
  readingText: { fontSize: rs(18.5), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '500', textAlign: 'center', lineHeight: rs(28) },
  bottomGraphicWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: hs(80), zIndex: 1 },
  scatterDot: { position: 'absolute', width: rs(4.5), height: rs(4.5), borderRadius: rs(2.5) },

  // ── Intro Cards (Section Covers) ──
  introCard2: {
    width: '100%', borderRadius: rs(16),
    borderWidth: 1, overflow: 'hidden',
    paddingBottom: 0,
    minHeight: hs(360),
  },
  sectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hs(12),
    marginBottom: hs(8),
    width: '100%',
    paddingHorizontal: rs(20),
  },
  badgeLine: {
    flex: 1,
    height: 1,
    maxWidth: rs(40),
  },
  badgeStar: {
    fontSize: rs(10),
    marginHorizontal: rs(8),
  },
  sectionBadge: {
    borderRadius: rs(20),
    paddingHorizontal: rs(16),
    paddingVertical: hs(6),
  },
  sectionBadgeText: { fontSize: rs(11), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  introIconArea: {
    alignSelf: 'center',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: hs(6),
  },
  svgRingWrapper: {
    width: rs(134),
    height: rs(134),
    justifyContent: 'center',
    alignItems: 'center',
  },
  introIconCircle: {
    position: 'absolute',
    width: rs(94), height: rs(94), borderRadius: rs(47),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  introTitleText2: {
    fontSize: rs(23), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: 'bold',
    textAlign: 'center', paddingHorizontal: rs(20),
    letterSpacing: 0.5,
  },
  introOrnamentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginVertical: hs(10),
  },
  introOrnamentLine: { width: rs(80), height: 1 },
  introOrnamentStar: { fontSize: rs(14), color: '#00ADC1', marginHorizontal: rs(12) },
  introSubtitleText2: {
    fontSize: rs(13.5), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '400',
    textAlign: 'center', paddingHorizontal: rs(30),
  },
  introInfoRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: rs(12), marginTop: hs(10),
    paddingHorizontal: rs(20),
  },
  introInfoPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingVertical: hs(6),
    borderRadius: rs(20),
    borderWidth: 1,
    borderColor: 'rgba(0,173,193,0.15)',
  },
  introInfoText: { fontSize: rs(13), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '600', color: '#0090A8' },

  // ── Bottom Navigation ──
  bottomNavWrapper: {
    width: '100%',
    paddingHorizontal: rs(24),
    paddingTop: hs(6),
    paddingBottom: Platform.OS === 'ios' ? hs(24) : hs(16),
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: rs(20),
    paddingHorizontal: rs(12),
    paddingVertical: hs(6),
    borderWidth: 1,
    borderColor: '#F0F4F8',
    shadowColor: '#00ADC1',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  squircleNavBtn: {
    width: rs(34), height: rs(34),
    borderRadius: rs(10),
    backgroundColor: '#3CA2A5', 
    borderWidth: rs(2),
    borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(24),
    paddingHorizontal: rs(20),
    height: rs(46),
  },
  navDivider: {
    width: 1,
    height: rs(20),
    marginHorizontal: rs(12),
  },
  navBtnText: {
    fontSize: rs(14),
    fontWeight: '600',
  },
  pauseWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.85 }],
  },
  pauseText: {
    fontSize: rs(11),
    fontWeight: '600',
    marginTop: hs(-4),
  },
  navCardTexts: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: rs(8),
  },
  navCardTitle: {
    fontSize: rs(13),
    fontWeight: '800',
  },
  navCardSubtitle: {
    fontSize: rs(9),
    marginTop: hs(1),
  },

  // ── Reference Card ──
  refCard: { backgroundColor: '#FFFFFF', borderTopRightRadius: rs(8), borderBottomRightRadius: rs(8), borderTopLeftRadius: rs(4), borderBottomLeftRadius: rs(4), borderLeftWidth: rs(6), borderLeftColor: '#00ADC1', borderWidth: 1, borderColor: '#00ADC1', padding: rs(16), paddingBottom: hs(40), position: 'relative', overflow: 'hidden' },
  refArabic: { fontSize: rs(22), fontWeight: '700', color: '#1A1A1A', textAlign: 'justify', lineHeight: rs(40), writingDirection: 'rtl', marginBottom: hs(16), zIndex: 2 },
  refLabel: { position: 'absolute', bottom: hs(12), left: rs(16), fontSize: rs(13), color: '#1A1A1A', fontWeight: '800', zIndex: 2 },
  refSplatter: { position: 'absolute', bottom: hs(-10), right: rs(-10), width: rs(80), height: rs(80), opacity: 0.15, zIndex: 1 },
  refSimpleMeaning: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refSignificance: { fontSize: rs(14), color: '#3A3A3A', lineHeight: rs(24) },
  refDividerWrap: { alignItems: 'center', marginVertical: hs(20) },
  goldDivider: { width: rs(140), height: hs(12), opacity: 0.9 },
  fadeInBlock: { width: '100%' },
  refBadgeRow: { marginBottom: hs(14) },
  refBadgePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: rs(12), paddingVertical: hs(5), borderRadius: rs(20), borderWidth: 1 },
  refBadgeText: { fontSize: rs(12), fontWeight: '700' },
  refSectionLabel: { fontSize: rs(11), fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: hs(10), color: '#00ADC1' },
  seeArabicBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: rs(14), paddingVertical: hs(8), borderRadius: rs(20), borderWidth: 1, marginBottom: hs(12) },
  seeArabicBtnText: { fontSize: rs(13), fontWeight: '700', color: '#00ADC1' },
  arabicVerseBox: { borderRadius: rs(12), borderWidth: 1, padding: rs(16), marginTop: hs(4) },
  modernArabicText: { fontSize: rs(20), fontWeight: '700', fontFamily: FONTS.arabicBold, textAlign: 'right', lineHeight: rs(38), writingDirection: 'rtl' },

  // ── Gifts Card ──
  giftCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(8), borderWidth: 1, borderColor: '#F0F4F8', marginBottom: hs(4) },
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
  practicalCardContainer: { backgroundColor: '#FFFFFF', borderRadius: rs(4), borderWidth: 1, borderColor: '#F0F4F8', marginBottom: hs(4) },
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
  scholarCard: { borderRadius: rs(12), padding: rs(24), borderWidth: 1, borderColor: '#F0F4F8', alignItems: 'center' },
  scholarName: { fontSize: rs(20), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '800', color: '#1A1A1A', marginBottom: hs(4) },
  scholarWork: { fontSize: rs(13), fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif', fontWeight: '700', color: '#1A1A1A', marginBottom: hs(16) },
  scholarQuote: { fontSize: rs(13), color: '#3A3A3A', fontStyle: 'italic', textAlign: 'center', lineHeight: rs(20) },

  // ── Reflection Cards (premium) ──
  reflectionCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
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
  quizMcqCard: { backgroundColor: '#FFFFFF', borderRadius: rs(16), padding: rs(20), borderWidth: 1, borderColor: 'rgba(0,173,193,0.10)' },
  quizMcqHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: hs(16) },
  quizMcqBadge: { width: rs(36), height: rs(36), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  quizMcqBadgeText: { fontSize: rs(13), fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  quizMcqQuestion: { flex: 1, fontSize: rs(14), fontWeight: '800', color: '#1A1A1A', lineHeight: rs(21) },

  // ── Quiz Options (shared with mastery) ──
  quizQuestion: { fontSize: rs(16), fontWeight: '700', color: '#1A1A1A', marginBottom: hs(20) },
  quizOptions: { gap: hs(12) },
  quizOptionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: rs(8), padding: rs(16), borderWidth: 1, borderColor: '#F0F4F8' },
  quizRadio: { width: rs(20), height: rs(20), borderRadius: rs(10), borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: rs(12) },
  quizRadioInner: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  quizOptionText: { fontSize: rs(14), color: '#1A1A1A' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: rs(4), padding: rs(8) },
  statusIconWrap: { width: rs(20), height: rs(20), borderRadius: rs(10), justifyContent: 'center', alignItems: 'center', marginRight: rs(8) },
  statusText: { fontSize: rs(13), fontWeight: '600' },

  tryAgainBtn: { alignSelf: 'center', marginTop: hs(16) },
  tryAgainText: { color: '#00ADC1', fontSize: rs(14), fontWeight: '700', textDecorationLine: 'underline' },

  // ── Premium 3-Button Floating Navigation Pill ──
  floatingNavContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? hs(30) : hs(20), alignSelf: 'center', width: '90%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: rs(40), paddingHorizontal: rs(10), paddingVertical: rs(8), borderWidth: 1, borderColor: '#F0F4F8' },
  floatingNavContainerDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  floatingIconBtn: { width: rs(44), height: rs(44), borderRadius: rs(22), overflow: 'hidden' },
  iconCircle: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  floatingCenterBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingCenterText: { fontSize: rs(16), fontWeight: '800', letterSpacing: 0.5 },

  // ── Journey screen ──
  journeyRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  journeyCard: { width: '100%', borderRadius: rs(16), paddingTop: hs(30), alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#F0F4F8', backgroundColor: '#FFFFFF' },
  journeyTitle: { fontSize: rs(28), fontWeight: '900', color: '#4CD6E8', marginBottom: hs(6), letterSpacing: 0.2 },
  journeySub: { fontSize: rs(13), color: '#666', marginBottom: hs(36), textAlign: 'center' },
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: hs(40) },
  journeyStepCard: { width: rs(105), height: rs(105), backgroundColor: '#FFFFFF', borderRadius: rs(8), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 173, 193, 0.1)' },
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
