import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../theme';
import { useAppTheme } from '../context/ThemeContext';
import Svg, { Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const rs = (n) => Math.round(n * (SW / 393));
const hs = (n) => Math.round(n * (SH / 900));

const STEP_META = {
  meaning: { label: 'Simple\nMeaning', icon: 'book-outline' },
  gifts: { label: 'Gift Of\nThis Name', icon: 'gift-outline' },
  quran: { label: "Parts From\nQur'an", icon: 'book-outline' },
  hadith: { label: 'Parts From\nHadith', icon: 'book-outline' },
  practical: { label: 'How To\nLive By It', icon: 'moon-outline' },
  scholarly: { label: 'Scholarly\nView', icon: 'school-outline' },
  reflection: { label: 'Reflection', icon: 'pencil-outline' },
  mastery: { label: 'Quiz', icon: 'help-circle-outline' },
};

const TrackerLeftLeaf = ({ color }) => (
  <Svg width={rs(12)} height={rs(24)} viewBox="0 0 12 24" style={{ position: 'absolute', left: -rs(16) }}>
    <Path d="M10 2 Q2 12 10 22" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M8 6 Q2 4 2 10 Q6 8 8 6" fill={color} opacity={0.8} />
    <Path d="M7 13 Q1 11 1 17 Q5 15 7 13" fill={color} opacity={0.8} />
  </Svg>
);

const TrackerRightLeaf = ({ color }) => (
  <Svg width={rs(12)} height={rs(24)} viewBox="0 0 12 24" style={{ position: 'absolute', right: -rs(16) }}>
    <Path d="M2 2 Q10 12 2 22" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M4 6 Q10 4 10 10 Q6 8 4 6" fill={color} opacity={0.8} />
    <Path d="M5 13 Q11 11 11 17 Q7 15 5 13" fill={color} opacity={0.8} />
  </Svg>
);

const NameDetailHeader = ({ name, steps = [], currentStepIndex = 0, isFavorite, isFocusMode, onFavoritePress, onSharePress, onSettingsPress }) => {
  const { isDark } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const teal = '#31A7A7'; // Matching image teal

  useEffect(() => {
    if (scrollViewRef.current && currentStepIndex >= 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({ x: currentStepIndex * rs(80), animated: true });
      }, 300);
    }
  }, [currentStepIndex]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent', paddingTop: hs(10), paddingHorizontal: rs(16) }]}>

      {/* ── UNIFIED HEADER CARD ── */}
      <View style={[
        styles.headerCard,
        {
          backgroundColor: isFocusMode ? 'transparent' : (isDark ? '#1E293B' : '#FFFFFF'),
          borderColor: isFocusMode ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : '#DCEFF2'),
          borderWidth: isFocusMode ? 0 : 1,
          shadowOpacity: isFocusMode ? 0 : 0.03,
          elevation: isFocusMode ? 0 : 2,
          overflow: 'hidden',
        }
      ]}>
        {/* Curved diagonal background shape on the left */}
        {!isFocusMode && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 350 54" preserveAspectRatio="none">
              <Path d="M0 0 L 120 0 Q 80 54 0 54 Z" fill={isDark ? 'rgba(0,173,193,0.1)' : '#EAF8FA'} />
            </Svg>
          </View>
        )}

        {/* Left: Back button (Squircle style with thick white border) */}
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: '#00ADC1',
              borderColor: isFocusMode ? 'transparent' : '#FFFFFF',
              shadowOpacity: isFocusMode ? 0 : 0.08,
              elevation: isFocusMode ? 0 : 2,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={rs(18)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Center: Name details */}
        <View style={styles.centerInfo}>
          <View style={styles.titleTextRow}>
            <Text style={[styles.arabicHeader, { color: '#00ADC1' }]}>{name.arabic || name.name}</Text>
            <View style={[styles.headerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }]} />
            <Text style={[styles.translitHeader, { color: isDark ? '#E8EDF2' : '#0F172A' }]}>{name.transliteration}</Text>
          </View>
          <Text style={[styles.meaningHeader, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            {name.meaning || name.en}
          </Text>
        </View>

        {/* Right: Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isFocusMode ? 'transparent' : (isDark ? '#1E293B' : '#FFFFFF'),
                borderColor: isFocusMode ? 'transparent' : (isDark ? 'rgba(255,255,255,0.15)' : '#F1F5F9'),
                borderWidth: isFocusMode ? 0 : 1,
                shadowOpacity: isFocusMode ? 0 : 0.25,
                elevation: isFocusMode ? 0 : 3,
              }
            ]}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={rs(16)} color={isFavorite ? "#EF4444" : '#00ADC1'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isFocusMode ? 'transparent' : (isDark ? '#1E293B' : '#FFFFFF'),
                borderColor: isFocusMode ? 'transparent' : (isDark ? 'rgba(255,255,255,0.15)' : '#F1F5F9'),
                borderWidth: isFocusMode ? 0 : 1,
                shadowOpacity: isFocusMode ? 0 : 0.25,
                elevation: isFocusMode ? 0 : 3,
              }
            ]}
            activeOpacity={0.8}
            onPress={onSharePress}
          >
            <Ionicons name="share-social-outline" size={rs(16)} color='#00ADC1' />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── STEP TRACKER ── */}
      {steps.length > 0 && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tracker}
          contentContainerStyle={[
            styles.trackerContent,
            steps.length <= 5 && { minWidth: SW, justifyContent: 'center' },
          ]}
        >
          {steps.map((step, i) => {
            const meta = STEP_META[step.type] || { label: step.type, icon: 'ellipse-outline' };
            const isActive = i === currentStepIndex;

            return (
              <React.Fragment key={i}>
                <View style={styles.stepItem}>
                  {isActive ? (
                    <View style={styles.activeOuterRing}>
                      <View style={[styles.faintRing, { borderColor: isDark ? 'rgba(49,167,167,0.3)' : 'rgba(49,167,167,0.2)' }]} />
                      <View style={[styles.activeInnerCircle, { backgroundColor: teal }]}>
                        <Ionicons name={meta.icon} size={rs(18)} color="#FFFFFF" />
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.inactiveCircle, {
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF'
                    }]}>
                      <Ionicons name={meta.icon} size={rs(18)} color={isDark ? '#64748B' : '#7E8B99'} />
                    </View>
                  )}
                  <Text
                    style={[styles.stepLabel, {
                      color: isActive ? teal : (isDark ? '#64748B' : '#7E8B99'),
                      fontWeight: isActive ? '600' : '500'
                    }]}
                  >
                    {meta.label}
                  </Text>
                </View>

                {i < steps.length - 1 && (
                  <View style={styles.dashConnectorContainer}>
                    <View style={[styles.dashLine, { borderColor: isDark ? '#334155' : '#CBD5E1' }]} />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', paddingBottom: hs(8), alignItems: 'center' },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(14),
    borderWidth: 1,
    paddingHorizontal: rs(10),
    height: hs(78),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: hs(28),
  },
  backBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: rs(8),
  },
  titleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicHeader: {
    fontFamily: FONTS.arabic,
    fontSize: rs(17),
    fontWeight: '700',
  },
  headerDivider: {
    width: 1,
    height: hs(14),
    marginHorizontal: rs(8),
  },
  translitHeader: {
    fontFamily: FONTS.bold,
    fontSize: rs(14),
  },
  meaningHeader: {
    fontFamily: FONTS.medium,
    fontSize: rs(11),
    marginTop: hs(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  actionBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8E9DAE',
    shadowOpacity: 0.25,
    shadowRadius: rs(4),
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Step Tracker
  tracker: { width: '100%' },
  trackerContent: {
    paddingHorizontal: rs(-10),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: rs(6),
  },
  stepItem: { alignItems: 'center', width: rs(68) },

  inactiveCircle: {
    width: rs(36), height: rs(36),
    borderRadius: rs(18),
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: hs(14),
  },

  activeOuterRing: {
    width: rs(46), height: rs(46),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: hs(9),
    marginTop: hs(-5),
  },
  faintRing: {
    position: 'absolute',
    width: rs(46), height: rs(46),
    borderRadius: rs(23),
    borderWidth: 1.5,
    borderColor: 'rgba(49,167,167,0.2)',
  },
  activeInnerCircle: {
    width: rs(36), height: rs(36),
    borderRadius: rs(18),
    justifyContent: 'center', alignItems: 'center',
  },

  stepLabel: {
    fontSize: rs(9.5),
    textAlign: 'center',
    lineHeight: hs(13),
  },

  dashConnectorContainer: {
    width: rs(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hs(18),
  },
  dashLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  redDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: '#EF4444',
    marginLeft: rs(8),
    marginRight: rs(4),
  }
});

export default NameDetailHeader;
