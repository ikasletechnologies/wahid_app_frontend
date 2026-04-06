import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useLanguage } from '../context/LanguageContext';

const NameCard = ({ name, index = 0 }) => {
  const { language } = useLanguage();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const displayName = language === 'ar' ? name.arabic : name.transliteration;

  return (
    <Animated.View style={[styles.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.85} style={styles.card}>
        {/* Neon top accent line */}
        <View style={styles.topAccent} />

        <View style={styles.inner}>
          {/* Number badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{name.number}</Text>
          </View>

          {/* Main content */}
          <View style={styles.content}>
            {/* Arabic calligraphy */}
            <Text style={styles.arabic} numberOfLines={1} adjustsFontSizeToFit>
              {name.arabic}
            </Text>

            {/* Transliteration / Arabic name */}
            <Text style={styles.transliteration} numberOfLines={1}>
              {displayName}
            </Text>

            {/* Meaning */}
            <View style={styles.meaningRow}>
              <View style={styles.meaningDot} />
              <Text style={styles.meaning} numberOfLines={2}>
                {name.meaning}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACE.md,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    ...SHADOW.card,
  },
  topAccent: {
    height: 2,
    backgroundColor: COLORS.neon.DEFAULT,
    opacity: 0.6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    gap: SPACE.md,
  },

  // Number badge
  badge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.neon.DEFAULT,
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...SHADOW.neon,
  },
  badgeNum: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
    color: COLORS.neon.DEFAULT,
  },

  // Content
  content: {
    flex: 1,
  },
  arabic: {
    fontFamily: FONTS.arabicBold,
    fontSize: SIZES.arabic.sm,
    color: COLORS.neon.DEFAULT,
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 2,
  },
  transliteration: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    color: COLORS.white,
    marginBottom: SPACE.xs,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.xs,
  },
  meaningDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.neon.DEFAULT,
    marginTop: 5,
    flexShrink: 0,
    opacity: 0.5,
  },
  meaning: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.muted,
    lineHeight: 18,
  },
});

export default NameCard;
