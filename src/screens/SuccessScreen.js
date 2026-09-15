import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, Dimensions, Animated, Easing, Platform } from 'react-native';
import Text from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const DecorativeBackground = ({ isDark }) => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {/* Soft top-left glow */}
    <View style={[styles.topLeftGlow, isDark && { backgroundColor: '#00ACC1', opacity: 0.05 }]} />
  </View>
);

const CustomDivider = ({ isDark }) => (
  <View style={styles.dividerRow}>
    <View style={[styles.dividerLine, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
    <View style={[styles.dividerDot, isDark && { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
    <View style={styles.dividerDiamond} />
    <View style={[styles.dividerDot, isDark && { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
    <View style={[styles.dividerLine, isDark && { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
  </View>
);

const SuccessScreen = ({ route }) => {
  const { user, accessToken, refreshToken } = route.params || {
    user: { name: 'Hari' },
    accessToken: 'test_access',
    refreshToken: 'test_refresh'
  };
  const { completeLogin } = useAuth();
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Entrance animations
  const checkmarkScale = useRef(new Animated.Value(0.4)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const bookOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  // Spin and pulse loops
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      // Checkmark pops in
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Card slides up and fades in
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Book image and button fade in together
      Animated.parallel([
        Animated.timing(bookOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Spin animation for the outer ring (infinite loop)
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for the background ripple (infinite loop)
    Animated.loop(
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rippleScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.4],
  });

  const rippleOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const handleContinue = async () => {
    await completeLogin(user, accessToken, refreshToken);
  };

  const displayName = user?.name || 'Learner';

  return (
    <LinearGradient
      colors={isDark ? ['#041012', '#080E10', '#050505'] : ['#EBF8FA', '#F4FDFE', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <DecorativeBackground isDark={isDark} />

      {/* Main Container */}
      <View style={styles.container}>

        {/* Top Checkmark Section */}
        <Animated.View style={[
          styles.checkmarkWrapper,
          { opacity: checkmarkOpacity, transform: [{ scale: checkmarkScale }] }
        ]}>
          <View style={styles.checkmarkOuterRingContainer}>
            {/* Pulsing Ripple Circle */}
            <Animated.View style={[
              styles.checkmarkRipple,
              isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' },
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              }
            ]} />

            {/* Spinning Dashed Ring */}
            <Animated.View style={[
              styles.checkmarkOuterRing,
              isDark && { borderColor: 'rgba(255, 255, 255, 0.22)' },
              { transform: [{ rotate: spin }] }
            ]} />

            {/* Fixed Inner Circle */}
            <View style={[
              styles.checkmarkInnerCircle,
              isDark && { backgroundColor: '#111111', shadowColor: '#00ACC1' }
            ]}>
              <Ionicons name="checkmark" size={38} color="#00ACC1" />
            </View>
          </View>
        </Animated.View>

        {/* Text Section */}
        <Animated.View style={[styles.textSection, { opacity: textOpacity }]}>
          <Text style={[styles.welcomeText, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
            Welcome, <Text style={styles.nameText}>{displayName}</Text>
          </Text>


          <CustomDivider isDark={isDark} />

          {/* <Text style={[styles.journeyText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            We have 
          </Text> */}
        </Animated.View>

        {/* Menu Cards */}
        <Animated.View style={[
          styles.card,
          isDark && { backgroundColor: '#111111', shadowColor: '#000', shadowOpacity: 0.1 },
          { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }
        ]}>

          {/* Row 1 */}
          <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
              <Ionicons name="book-outline" size={20} color="#00ACC1" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardRowTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>99 Beautiful Names</Text>
              <Text style={[styles.cardRowSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Explore and learn at your own pace.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#03B7CE" />
          </TouchableOpacity>

          <View style={[styles.cardDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />

          {/* Row 2 */}
          <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
              <Feather name="target" size={20} color="#00ACC1" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardRowTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Track Progress</Text>
              <Text style={[styles.cardRowSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>See your growth and stay motivated.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#03B7CE" />
          </TouchableOpacity>

          <View style={[styles.cardDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />

          {/* Row 3 */}
          <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
              <Ionicons name="star" size={20} color="#00ACC1" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardRowTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Learn Daily</Text>
              <Text style={[styles.cardRowSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Build a habit and grow closer to Allah.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#03B7CE" />
          </TouchableOpacity>

        </Animated.View>

        {/* Bottom Graphic */}
        <Animated.View style={[styles.graphicContainer, { opacity: bookOpacity }]}>
          <Image
            source={require('../../assets/successbook.png')}
            style={styles.bookImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Button */}
        <Animated.View style={[styles.btnWrap, { opacity: btnOpacity, paddingBottom: Math.max(insets.bottom + 16, Platform.OS === 'ios' ? 36 : 24) }]}>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.85} style={styles.buttonContainer}>
            <LinearGradient
              colors={['#00BAD4', '#0097AB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Start Learning</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,

  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.18,
  },

  // Decorative Background elements
  topLeftGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#03B7CE',
    opacity: 0.08,
  },
  // Checkmark styles
  checkmarkWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmarkOuterRingContainer: {
    width: 106,
    height: 106,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmarkOuterRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: '#9FE0E8',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  checkmarkInnerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#00ACC1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 2,
  },
  checkmarkRipple: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EBF8FA',
    zIndex: 0,
  },
  // Text section
  textSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F203C',
    textAlign: 'center',
    marginBottom: 4,
  },
  nameText: {
    color: '#00BAD4',
  },
  accountReadyText: {
    fontSize: 15,
    color: '#718096',
    fontWeight: '600',
  },
  journeyText: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Custom Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    gap: 8,
  },
  dividerLine: {
    width: 20,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  dividerDiamond: {
    width: 5,
    height: 5,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#00ACC1',
  },

  // Card styles
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#0F203C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    zIndex: 10,
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F203C',
    marginBottom: 2,
  },
  cardRowSubtitle: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },

  // Graphic container
  graphicContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 180,
    marginBottom: 20,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },

  // Button wrapping
  btnWrap: {
    width: '100%',
    paddingBottom: 0,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00BAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginTop: 1,
  },
});

export default SuccessScreen;
