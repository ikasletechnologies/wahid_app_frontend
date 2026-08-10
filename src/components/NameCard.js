import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Text from './AppText';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useLanguage } from '../context/LanguageContext';

const NameCard = ({ name, index = 0 }) => {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const displayName = language === 'ar' ? name.arabic : name.transliteration;
  const isRTL = language === 'ar';

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          ...(isRTL && styles.rtlWrap)
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.card}
        onPress={() => {
          // Add your onPress logic here
          console.log('Pressed:', name.number);
        }}
      >
        {/* Gradient top accent */}
        <View style={styles.topAccent}>
          <View style={styles.gradientAccent} />
        </View>

        <View style={[styles.inner, isRTL && styles.rtlInner]}>
          {/* Number badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeNumber}>{String(name.number).padStart(2, '0')}</Text>
          </View>

          {/* Main content */}
          <View style={[styles.content, isRTL && styles.rtlContent]}>
            {/* Arabic calligraphy */}
            <Text style={[styles.arabic, isRTL && styles.rtlText]} numberOfLines={1} adjustsFontSizeToFit>
              {name.arabic}
            </Text>

            {/* Transliteration / Arabic name */}
            <Text style={[styles.transliteration, isRTL && styles.rtlText]} numberOfLines={1}>
              {displayName}
            </Text>

            {/* Meaning */}
            <View style={[styles.meaningRow, isRTL && styles.rtlMeaningRow]}>
              <View style={styles.meaningDot} />
              <Text style={[styles.meaning, isRTL && styles.rtlText]} numberOfLines={2}>
                {name.meaning}
              </Text>
            </View>
          </View>

          {/* Interactive indicator */}
          <View style={styles.interactiveIcon}>
            <View style={styles.chevron} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACE.md,
    paddingHorizontal: SPACE.sm,
  },
  rtlWrap: {
    direction: 'rtl',
  },
  card: {
    backgroundColor: COLORS.cardBg || 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.xl || 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...SHADOW.card,
    backdropFilter: 'blur(10px)',
  },
  topAccent: {
    height: 3,
    backgroundColor: 'transparent',
  },
  gradientAccent: {
    flex: 1,
    backgroundColor: COLORS.neon?.DEFAULT || '#00ff88',
    opacity: 0.8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.xl || 30,
    paddingHorizontal: SPACE.lg || 20,
    gap: SPACE.md || 16,
    position: 'relative',
  },
  rtlInner: {
    flexDirection: 'row-reverse',
  },

  // Number badge
  badge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full || 999,
    borderWidth: 2,
    borderColor: COLORS.neon?.DEFAULT || '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...SHADOW.neon,
  },
  badgeNumber: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.md || 16,
    color: COLORS.neon?.DEFAULT || '#00ff88',
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
  },
  rtlContent: {
    alignItems: 'flex-end',
  },
  arabic: {
    fontFamily: FONTS.arabicBold,
    fontSize: SIZES.arabic?.md || 28,
    color: COLORS.neon?.DEFAULT || '#00ff88',
    textAlign: 'left',
    lineHeight: 42,
    marginBottom: SPACE.xs || 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  transliteration: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg || 18,
    color: COLORS.white || '#ffffff',
    marginBottom: SPACE.sm || 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.xs || 8,
  },
  rtlMeaningRow: {
    flexDirection: 'row-reverse',
  },
  meaningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neon?.DEFAULT || '#00ff88',
    marginTop: 6,
    flexShrink: 0,
    opacity: 0.7,
  },
  meaning: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm || 13,
    color: COLORS.muted || 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  rtlText: {
    textAlign: 'right',
  },

  // Interactive chevron icon
  interactiveIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.white || '#ffffff',
    transform: [{ rotate: '45deg' }],
    marginLeft: -4,
  },
});

export default NameCard;