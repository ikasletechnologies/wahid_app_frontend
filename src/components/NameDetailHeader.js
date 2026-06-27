import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
    <Path d="M8 6 Q2 4 2 10 Q6 8 8 6" fill={color} opacity={0.8}/>
    <Path d="M7 13 Q1 11 1 17 Q5 15 7 13" fill={color} opacity={0.8}/>
  </Svg>
);

const TrackerRightLeaf = ({ color }) => (
  <Svg width={rs(12)} height={rs(24)} viewBox="0 0 12 24" style={{ position: 'absolute', right: -rs(16) }}>
    <Path d="M2 2 Q10 12 2 22" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M4 6 Q10 4 10 10 Q6 8 4 6" fill={color} opacity={0.8}/>
    <Path d="M5 13 Q11 11 11 17 Q7 15 5 13" fill={color} opacity={0.8}/>
  </Svg>
);

const NameDetailHeader = ({ name, steps = [], currentStepIndex = 0, isFavorite, onFavoritePress, onSharePress }) => {
  const { isDark } = useAppTheme();
  const navigation = useNavigation();
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
    <View style={styles.container}>
      {/* ── HEADER CARD ── */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', shadowColor: isDark ? '#000' : '#4DB6AC' }]}>

        {/* Subtle left background curve */}
        <View style={styles.cardBgWrapper}>
          <Svg width="100%" height="100%" viewBox="0 0 160 85" preserveAspectRatio="none">
            <Path
              d="M0 0 L160 0 C 120 40, 100 85, 60 85 L0 85 Z"
              fill={isDark ? 'rgba(49,167,167,0.1)' : '#EAF7F8'}
            />
          </Svg>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={rs(16)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Middle Content */}
        <View style={styles.middleArea} pointerEvents="none">
          <View style={styles.topTextRow}>
            <View style={styles.arabicSection}>
              <Text style={[styles.arabicText, { color: isDark ? '#E8EDF2' : '#11323B' }]}>{name.arabic}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

            <View style={styles.englishSection}>
              <Text style={[styles.translitText, { color: isDark ? '#E8EDF2' : '#11323B' }]}>{name.transliteration}</Text>
            </View>
          </View>

          <Text style={[styles.meaningText, { color: isDark ? '#94A3B8' : '#7E8B99' }]} numberOfLines={1}>
            {name.meaning || name.en}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]} activeOpacity={0.8} onPress={onFavoritePress}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={rs(14)} color={isFavorite ? "#EF4444" : teal} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]} activeOpacity={0.8} onPress={onSharePress}>
            <Ionicons name="share-social-outline" size={rs(14)} color={teal} />
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
  container: { width: '100%', paddingBottom: hs(6), alignItems: 'center' },

  // Header Card
  card: {
    width: SW - rs(24), // slightly wider
    height: hs(72),
    borderRadius: rs(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hs(10),
    marginBottom: hs(24),
    shadowOpacity: 0.12,
    shadowRadius: rs(12),
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  cardBgWrapper: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%',
    zIndex: 0,
  },
  backBtn: {
    position: 'absolute',
    left: rs(10),
    width: rs(36), height: rs(36),
    borderRadius: rs(12),
    backgroundColor: '#3CA2A5',
    borderWidth: rs(2),
    borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#3CA2A5', shadowOpacity: 0.3, shadowRadius: rs(4), shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  middleArea: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(70), // prevent overlapping with absolute buttons
    zIndex: 1,
  },
  topTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicSection: {
    top: hs(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  arabicText: {
    fontSize: rs(20),
    fontFamily: FONTS.arabic,
    fontWeight: '700',
    marginHorizontal: rs(6),
  },
  divider: {
    width: 1,
    height: hs(24),
    marginHorizontal: rs(10),
  },
  englishSection: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  translitText: { fontSize: rs(16), fontWeight: '700', fontFamily: FONTS.semiBold },
  meaningText: { fontSize: rs(12), fontWeight: '500', marginTop: hs(2), textAlign: 'center' },
  actionsRow: {
    position: 'absolute',
    right: rs(10),
    flexDirection: 'row',
    gap: rs(10),
    zIndex: 10,
  },
  actionBtn: {
    width: rs(34), height: rs(34),
    borderRadius: rs(11), // squircle
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#8E9DAE',
    shadowOpacity: 0.45,
    shadowRadius: rs(8),
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  // Step Tracker
  tracker: { width: '100%' },
  trackerContent: {
    paddingHorizontal: rs(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  }
});

export default NameDetailHeader;
