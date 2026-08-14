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

const NameDetailHeader = ({ name, steps = [], currentStepIndex = 0, isFavorite, onFavoritePress, onSharePress, onSettingsPress }) => {
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
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      
      {/* ── HEADER NAVBAR ROW (Actions safely below notch) ── */}
      <View style={[styles.topNavRow, { paddingTop: Math.max(insets.top + hs(10), hs(24)), justifyContent: 'space-between' }]}>
        {/* Left Back Arrow Button (Borderless, clean, no square box) */}
        <TouchableOpacity
          style={styles.headerBackBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={rs(22)} color={isDark ? '#E8EDF2' : teal} />
        </TouchableOpacity>

        {/* Right Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]} activeOpacity={0.8} onPress={onSettingsPress}>
            <Ionicons name="text-outline" size={rs(16)} color={teal} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]} activeOpacity={0.8} onPress={onFavoritePress}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={rs(16)} color={isFavorite ? "#EF4444" : teal} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]} activeOpacity={0.8} onPress={onSharePress}>
            <Ionicons name="share-social-outline" size={rs(16)} color={teal} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── NAME TITLE AREA (Cleanly separated below top navbar) ── */}
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          <Text style={[styles.arabicText, { color: isDark ? '#C5F2F7' : '#11323B' }]}>{name.arabic || name.name}</Text>
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
          <View style={styles.englishSection}>
            <Text style={[styles.translitText, { color: isDark ? '#E8EDF2' : '#11323B' }]}>{name.transliteration}</Text>
          </View>
        </View>

        <Text style={[styles.meaningText, { color: isDark ? '#C5F2F7' : '#334155', fontWeight: '500' }]} numberOfLines={1}>
          {name.meaning || name.en}
        </Text>
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

  // Top Navbar Row (Back button left, Actions right)
  topNavRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    marginBottom: hs(12),
    zIndex: 10,
  },
  backBtn: {
    width: rs(38), height: rs(38),
    borderRadius: rs(12),
    backgroundColor: '#3CA2A5',
    borderWidth: rs(2),
    borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#3CA2A5', shadowOpacity: 0.3, shadowRadius: rs(4), shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  headerBackBtn: {
    width: rs(36),
    height: rs(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  actionBtn: {
    width: rs(36), height: rs(36),
    borderRadius: rs(12),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#8E9DAE',
    shadowOpacity: 0.35,
    shadowRadius: rs(6),
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  // Title Area below navbar
  titleArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
    marginBottom: hs(14),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  arabicText: {
    fontSize: rs(24),
    fontFamily: FONTS.arabic,
    fontWeight: '700',
    marginHorizontal: rs(8),
  },
  divider: {
    width: 1.5,
    height: hs(22),
    marginHorizontal: rs(10),
  },
  englishSection: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  translitText: { fontSize: rs(18), fontWeight: '700', fontFamily: FONTS.semiBold },
  meaningText: { fontSize: rs(14), fontWeight: '500', marginTop: hs(4), textAlign: 'center' },

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
